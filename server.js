const { Readable } = require('stream')
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
  const { username } = req.params
  const clientSocket = findClientSocketByUsername(username)

  if (!clientSocket)
    return res.status(404).json({ message: 'Client not available' })

  const url = req.url.replace(`/${username}`, ''),
    { method, headers, body } = req,
    requestId = uid(),
    responseId = requestId

  const clientRequest = {
    requestId,
    url,
    method,
    headers,
    body
  }
  clientSocket.emit('request', clientRequest)

  const handleClientResponse = clientResponse => {
    clientSocket.off(responseId, handleClientResponse)

    const filename =
      parseUrl(url).path === '/' ? 'index.html' : url.split('/').pop() // TODO: get from response
    res.set('Content-disposition', `inline; filename="${filename}"`)
    res.contentType(clientResponse.headers['content-type'] || 'text/plain')
    res.set(
      'Last-Modified',
      clientResponse.headers['last-modified'] || new Date().toUTCString()
    )
    res.set(
      'Cache-Control',
      clientResponse.headers['cache-control'] || 'public, max-age=0'
    )
    res.set(
      'Content-Length',
      Buffer.byteLength(clientResponse.data, 'binary').toString()
    )
    res.status(clientResponse.status)
    const stream = Readable.from(clientResponse.data)
    stream.pipe(res)
    stream.on('end', () => stream.destroy())
    stream.on('error', () => console.log(url, 'stream error'))
  }
  clientSocket.on(responseId, handleClientResponse)
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
