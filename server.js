const express = require('express')
const app = express()

const { json, urlencoded, static } = express
app.use(json())
app.use(urlencoded({ extended: true }))
app.use('/', static('public'))

let clientSockets = []
function findClientSocketByUsername(username) {
  return clientSockets.find(socket => socket.username === username)
}
function removeClientSocket(clientSocket) {
  clientSockets = clientSockets.filter(socket => socket.id !== clientSocket.id)
}

const { Readable } = require('stream')

app.get('/:username/*', (req, res) => {
  const { username } = req.params
  const clientSocket = findClientSocketByUsername(username)

  if (clientSocket) {
    const { url, method, headers, body } = req
    const clientRequest = {
      url: url.replace(`/${username}`, ''),
      method,
      headers,
      body // TODO: confirm binary
    }
    clientSocket.emit('request', clientRequest)

    function onClientResponse(clientResponse) {
      clientSocket.off('response', onClientResponse)
      const url = req.url.split('/')
      const filename = url[url.length - 1]
      res.contentType(clientResponse.headers['content-type'] || 'text/plain')
      res.set('Content-disposition', `inline; filename="${filename}"`)
      // res.set('Content-Transfer-Encoding', 'binary')
      // res.status(200).send(clientResponse.data)

      const stream = Readable.from(clientResponse.data)
      stream.pipe(res)
    }
    clientSocket.on('response', onClientResponse)
  } else res.json({ message: 'Client not available' })
})

app.post('/validateusername', (req, res) => {
  const { username } = req.body
  if (findClientSocketByUsername(username))
    res.status(200).json({ isValidUsername: false })
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

const io = require('socket.io')(server)

io.on('connection', socket => {
  socket.on('username', data => {
    socket.username = data.username
    clientSockets.push(socket)
    console.log(
      `Joined ${socket.id} ${socket.username} Total users: ${clientSockets.length}`
    )
  })
  socket.on('disconnect', () => {
    removeClientSocket(socket)
    console.log(
      `Left ${socket.id} ${socket.username} Total users: ${clientSockets.length}`
    )
  })
})
