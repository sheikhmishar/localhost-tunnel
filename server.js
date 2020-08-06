const multer = require('multer')().any()
const express = require('express')
const app = express()
const { parse: parseUrl } = require('url')
const { v1: uid } = require('uuid')
const { join } = require('path')
const { watch } = require('fs')
const { raw, static } = express

const validTextTypes = [
    'text/plain',
    'application/json',
    'application/x-www-form-urlencoded'
  ],
  xmlRegex = /^(text\/xml|application\/([\w!#\$%&\*`\-\.\^~]+\+)?xml)$/i
const isTextRequest = req => {
  const contentType = req.get('Content-Type')
  if (xmlRegex.test(contentType)) return true
  for (let i = 0; i < validTextTypes.length; i++)
    if (req.is(validTextTypes[i])) return true
  return false
}
const textParser = (req, res, next) => {
  if (isTextRequest(req)) {
    let chunks = ''
    req.setEncoding('utf8')
    req.on('data', chunk => (chunks += chunk)) // TODO: big text via stream
    req.on('end', () => {
      req.body = chunks // TODO: attach noting to body
      next()
    })
    req.on('error', err => next(err))
  }
  else next()
}

app.use(raw())
app.use(textParser)
app.use(multer)
const publicDir = join(__dirname, 'public')
app.use(static(publicDir))

const log = (...args) =>
  process.env.NODE_ENV !== 'production' ? true && console.log(...args) : false

let clientSockets = []
const findClientSocketByUsername = username =>
    clientSockets.find(socket => socket.username === username),
  removeClientSocket = clientSocket =>
    (clientSockets = clientSockets.filter(({ id }) => id !== clientSocket.id))

const handleTunneling = (req, res) => {
  // Redirecting all requests from requester to client localhost
  const { username } = req.params
  const clientSocket = findClientSocketByUsername(username)
  if (!clientSocket)
    return res.status(404).json({ message: 'Client not available' })

  const requestId = uid(),
    { method, headers, body } = req,
    url = req.url.replace(`/${username}`, ''),
    fileName = parseUrl(url).path === '/' ? 'index.html' : url.split('/').pop() // TODO: get from response

  const request = {
    requestId,
    url,
    method,
    headers, // get content-type for form data, xml, urlencoded on client side
    body
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
      return log(
        method,
        url,
        responseLength > 1024 * 1024
          ? (responseLength / 1024 / 1024).toFixed(2) + 'MB'
          : (responseLength / 1024).toFixed(2) + 'KB'
      )
    }

    res.status(status)
    res.set({
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Last-Modified': headers['last-modified'] || new Date().toUTCString(),
      'Cache-Control': headers['cache-control'] || 'public, max-age=0',
      'Content-Length': dataByteLength
    })
    res.contentType(headers['content-type'] || fileName)
  })
}
app.all('/:username/*', handleTunneling)

const validateUsername = (req, res) => {
  const { username } = req.body
  if (findClientSocketByUsername(username))
    res.status(400).json({ isValidUsername: false })
  else res.status(200).json({ isValidUsername: true })
}
app.post('/validateusername', validateUsername)

app.post('/upload', (req, res) => {
  if (req.is('multipart/form-data')) {
    const { body, files } = req
    if (Object.keys(body).length) log('form data', body)
    if (files) files.map(file => log(file))
  } else log(req.body)
  res.sendStatus(200)
})

app.get('/ping', (req, res) =>
  res.status(200).json({ message: 'Server is alive' })
)

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
watch(publicDir, { recursive: true }, () => io.of('/watch').emit('refresh'))

const onNewClientConnection = socket => {
  socket.on('username', ({ username }) => {
    socket.removeAllListeners('username')
    // @ts-ignore
    socket.username = username
    clientSockets.push(socket)
    log(`Joined ${socket.id} ${username} Total users: ${clientSockets.length}`)
  })
  socket.on('disconnect', () => {
    removeClientSocket(socket)
    log(
      `Left ${socket.id} ${socket.username} Total users: ${clientSockets.length}`
    )
  })
}
io.of('/tunnel').on('connection', onNewClientConnection)
