const { v1: uid } = require('uuid')
const parseUrl = require('url').parse
const express = require('express')
const app = express()

const { json, urlencoded, raw, static } = express // TODO: add raw and formdata support
app.use(json())
app.use(urlencoded({ extended: true }))
app.use(static('public'))

let clientSockets = []
const findClientSocketByUsername = username =>
    clientSockets.find(socket => socket.username === username),
  removeClientSocket = clientSocket =>
    (clientSockets = clientSockets.filter(
      socket => socket.id !== clientSocket.id
    ))

app.all('/:username/*', (req, res) => {
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
    headers,
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
        return res.end()
      }

      res.write(data)
      responseLength += Buffer.byteLength(data, 'binary')
      return console.log(
        method,
        url,
        responseLength > 1024 * 1024
          ? (responseLength / 1024 / 1024).toFixed(2) + 'MB'
          : (responseLength / 1024).toFixed(2) + 'KB'
      )
    }

    res.status(status)
    res.set({
      'Content-disposition': `inline; filename="${fileName}"`,
      'Last-Modified': headers['last-modified'] || new Date().toUTCString(),
      'Cache-Control': headers['cache-control'] || 'public, max-age=0',
      'Content-Length': dataByteLength
    })
    res.contentType(headers['content-type'] || fileName)
  })
})

app.post('/validateusername', (req, res) => {
  const { username } = req.body
  if (findClientSocketByUsername(username))
    res.status(400).json({ isValidUsername: false })
  else res.status(200).json({ isValidUsername: true })
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
const server = app.listen(PORT, () =>
  console.log(`Running server on port ${PORT}`)
)

require('socket.io')(server).on('connection', socket => {
  socket.on('username', ({ username }) => {
    socket.removeAllListeners('username')
    // @ts-ignore
    socket.username = username
    clientSockets.push(socket)
    console.log(
      `Joined ${socket.id} ${username} Total users: ${clientSockets.length}`
    )
  })
  socket.on('disconnect', () => {
    removeClientSocket(socket)
    console.log(
      // @ts-ignore
      `Left ${socket.id} ${socket.username} Total users: ${clientSockets.length}`
    )
  })
})
