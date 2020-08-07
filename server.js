const express = require('express')
const app = express()

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
  const contentType = req.get('Content-Type')
  if (is(contentType, validTextTypes)) {
    let chunks = ''
    req.setEncoding('utf8')
    req.on('data', chunk => (chunks += chunk)) // TODO: big text via stream
    req.on('end', () => {
      req.body = chunks // TODO: attach noting to body
      next()
    })
    req.on('error', err => next(err))
  } else next()
}

const busboy = require('busboy')
const formDataParser = (req, res, next) => {
  const contentType = req.get('Content-Type')
  if (is(contentType, ['multipart'])) {
    // busboy()//
    // let chunks = ''
    // req.setEncoding('utf8')
    // req.on('data', chunk => (chunks += chunk)) // TODO: big text via stream
    // req.on('end', () => {
    //   req.body = chunks // TODO: attach noting to body
    //   next() // TODO: drain req stream
    // })
    // req.on('error', err => next(err))
    next()
  } else next()
}

const publicDir = require('path').join(__dirname, 'public')
const multer = require('multer')
const { raw, static } = express
app.use(static(publicDir))
app.use(multer().any()) // TODO: remove
app.use(raw())

const log = (...args) =>
  process.env.NODE_ENV !== 'production' ? true && console.log(...args) : false

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
app.all('/:username/*', textParser, /* formDataParser*/ handleTunneling) // TODO: formDataParser

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
const { json, text } = express,
  urlencoded = express.urlencoded({ extended: true })
/* TODO: add multer */
app.all('/tunneltest', json(), text(), urlencoded, (req, res) => {
  req.on('data', chunk => log('chunk', chunk))

  const { body, files } = req
  log('----------------\nbody\n----------------\n', body)
  if (files) log('----------------\nfiles\n----------------\n', files)
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
