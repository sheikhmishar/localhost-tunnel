const express = require('express')
const app = express()

const log = process.env.NODE_ENV !== 'production' ? console.log : () => true

const { is } = require('type-is')
const validTextTypes = [
  'text/*',
  'json',
  'xml',
  'application/*+json',
  'application/*+xml',
  'urlencoded'
]
const textParser = (req, res, next) => {
  if (
    Object.keys(req.body).length ||
    !is(req.get('Content-Type'), validTextTypes)
  )
    return next()

  let chunks = ''
  req.setEncoding('utf8')
  req.on('data', chunk => (chunks += chunk)) // TODO: big text via stream
  req.on('end', () => {
    req.body = chunks // TODO: attach nothing to body, instead stream
    next()
  })
  req.on('error', error => next(error))
}

const Busboy = require('busboy')
const concatStream = require('concat-stream')
const formDataParser = (req, res, next) => {
  // TODO: handle content type ; boundary not set next()
  if (!is(req.get('Content-Type'), ['multipart'])) return next()

  const files = []
  const busboy = new Busboy({ headers: req.headers })
  busboy.on('error', error => next(error))
  busboy.on('field', (fieldname, value) => (req.body[fieldname] = value))
  busboy.on('file', (fieldname, fstream, filename, encoding, mimetype) => {
    if (!filename) return fstream.resume()

    const file = {
      fieldname,
      originalname: filename, // TODO: filename
      encoding,
      mimetype
    }

    // TODO: remove and directly stream
    const buffer = concatStream({ encoding: 'buffer' }, concatedBuffer => {
      fstream.unpipe(buffer)
      file.buffer = concatedBuffer
      file.size = concatedBuffer.length
      files.push(file)
    })
    fstream.pipe(buffer)

    fstream.on('data', data => log('fstream', filename, data.length, 'B'))
    fstream.on('end', () => true)
    fstream.on('error', error => next(error))
  })
  busboy.on('finish', () => {
    req.unpipe(busboy)
    busboy.removeAllListeners()

    req.files = files

    req.on('data', chunk => log('drain', chunk))
    req.on('end', () => log('drain end'))
    // req.on('readable', req.read.bind(req)) // TODO: possibly drain

    next()
  })
  req.pipe(busboy)
}

const publicDir = require('path').join(__dirname, 'public')
const { raw, static } = express
app.use(static(publicDir))
app.use(raw())

const KB = 1024,
  MB = KB * KB,
  GB = MB * KB
// human friendly byte string
const byteToString = bytes => {
  if (bytes > GB) return `${(bytes / GB).toFixed(2)} GB`
  else if (bytes > MB) return `${(bytes / MB).toFixed(2)} MB`
  else if (bytes > KB) return `${(bytes / KB).toFixed(2)} KB`
  return `${bytes} B`
}

let clientSockets = []
const findClientSocketByUsername = username =>
    clientSockets.find(socket => socket.username === username),
  removeClientSocket = clientSocket =>
    (clientSockets = clientSockets.filter(({ id }) => id !== clientSocket.id))

const { parse: parseUrl } = require('url')
const { v1: uid } = require('uuid')
const handleTunneling = (req, res) => {
  // Redirecting all requests from requester to client localhost
  const { username } = req.params
  const clientSocket = findClientSocketByUsername(username)
  if (!clientSocket)
    return res.status(404).json({ message: 'Client not available' })

  const { files = [] } = req,
    requestId = uid(),
    { method, headers, body } = req,
    url = req.url.replace(`/${username}`, ''),
    fileName = parseUrl(url).path === '/' ? 'index.html' : url.split('/').pop()

  const request = {
    requestId,
    url,
    method,
    headers,
    body, // TODO: stream
    files // TODO: stream
  }
  clientSocket.emit('request', request)

  // Redirecting all client localhost responses to requester
  const responseId = requestId
  let responseLength = 0
  clientSocket.on(responseId, ({ status, headers, data, dataByteLength }) => {
    if (data) {
      if (typeof data === 'string' && data === 'DONE') {
        clientSocket.removeAllListeners(responseId)
        if (res.get('Content-length') !== responseLength.toString())
          log('Content-length mismatch')
        return res.end()
      }

      res.write(data)
      responseLength += Buffer.byteLength(data, 'binary')
      return log(method, url, byteToString(responseLength))
    }

    res.status(status)
    res.set({
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Last-Modified': headers['last-modified'] || new Date().toUTCString(),
      'Cache-Control': headers['cache-control'] || 'public, max-age=0',
      'Content-Length': headers['content-length'] || dataByteLength,
      Etag: headers['etag']
    }) // TODO: {...headers}
    res.contentType(headers['content-type'] || fileName)
  })
}
app.all('/:username/*', textParser, formDataParser, handleTunneling)

const validateUsername = (req, res) => {
  const { username } = req.body
  if (findClientSocketByUsername(username))
    res.status(400).json({ isValidUsername: false })
  else res.status(200).json({ isValidUsername: true })
}
app.post('/validateusername', validateUsername)

app.get('/ping', (req, res) =>
  res.status(200).json({ message: 'Server is alive' })
)

// test loopback route
const { json } = express,
  urlencoded = express.urlencoded({ extended: true }),
  multer = require('multer')().any()
app.all('/tunneltest', json(), urlencoded, multer, textParser, (req, res) => {
  req.on('data', chunk => log('req not parsed yet\n', chunk))

  const { body, files } = req
  log('----------------\nbody\n----------------\n', body)
  if (files.length) log('----------------\nfiles\n----------------\n', files)
  res.sendStatus(200)
})

app.use((req, res, next) =>
  res.status(404).json({ message: '404 Invalid Route' })
)

app.use((err, req, res, next) =>
  res.status(500).json({ message: '500 Internal Server Error' })
)

const PORT = process.env.PORT || 5000
const server = app.listen(PORT, () => log(`Running server on port ${PORT}`))
const io = require('socket.io')(server, { path: '/sock' })

io.of('/watch').on('connection', socket => log('visited', socket.client.id))
require('fs').watch(publicDir, { recursive: true }, () =>
  io.of('/watch').emit('refresh')
)

const onNewClientConnection = socket => {
  socket.on('username', ({ username }) => {
    socket.removeAllListeners('username')
    socket.username = username
    clientSockets.push(socket)
    log(`Joined ${socket.id} ${username} Total users: ${clientSockets.length}`)
  })
  socket.on('disconnect', () => {
    removeClientSocket(socket)
    socket.removeAllListeners()
    socket.disconnect(true)
    log(
      `Left ${socket.id} ${socket.username} Total users: ${clientSockets.length}`
    )
  })
}
io.of('/tunnel').on('connection', onNewClientConnection)
