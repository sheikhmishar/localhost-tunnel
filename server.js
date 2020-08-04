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
    fileName = parseUrl(url).path === '/' ? 'index.html' : url.split('/').pop() // TODO: get from response

  const clientRequest = {
    requestId,
    url,
    method,
    headers,
    body
  }
  clientSocket.emit('request', clientRequest)

  const responseId = requestId
  let clientResponseLength = 0,
    clientResponseStatus = 200
  const handleClientResponse = clientResponse => {
    if (clientResponse.data) {
      const { data } = clientResponse
      if (typeof data === 'string' && data === 'DONE') {
        clientSocket.off(responseId, handleClientResponse)
        // res.set('Content-Length', clientResponseLength.toString()) // TODO: fix content-length
        res.status(clientResponseStatus)
        return res.end()
      }
      clientResponseLength += Buffer.byteLength(data, 'binary')
      console.log(
        method,
        url,
        clientResponseLength > 1024 * 1024
          ? (clientResponseLength / 1024 / 1024).toFixed(2) + 'MB'
          : (clientResponseLength / 1024).toFixed(2) + 'KB'
      )
      return res.write(data)
    }

    const { status, headers } = clientResponse

    clientResponseStatus = status
    res.set({
      'Content-disposition': `inline; filename="${fileName}"`,
      'Last-Modified': headers['last-modified'] || new Date().toUTCString(),
      'Cache-Control': headers['cache-control'] || 'public, max-age=0'
    })
    res.contentType(headers['content-type'] || fileName)
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

app.get('/stream', (req, res) => {
  // TODO: fix not streaming in chunk
  // res.set({
  //   'Content-disposition': `inline; filename="stream.txt"`,
  //   'Last-Modified': new Date().toUTCString(),
  //   'Cache-Control': 'public, max-age=0'
  // })
  res.contentType('text/plain')
  res.status(200)

  const stream = Readable.from('dsahhjh', { autoDestroy: false })
  stream.pipe(res)

  setTimeout(() => stream.push('hi'), 1000)
  setTimeout(() => stream.push('hidsa'), 1000)
  setTimeout(() => stream.push('hdsai'), 1000)
  setTimeout(() => stream.push('hidas'), 1000)
  setTimeout(() => stream.push('hdsi'), 1000)
  setTimeout(() => res.end(), 6000)
})

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
