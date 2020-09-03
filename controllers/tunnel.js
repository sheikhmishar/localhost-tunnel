const { findClientSocketByUsername } = require('../models/ClientSocket')
const { byteToString, log } = require('../helpers')
const parseUrl = require('url').parse
const uid = require('uuid').v1

const validateUsername = (req, res) => {
  if (findClientSocketByUsername(req.body.username))
    res.status(400).json({ isValidUsername: false })
  else res.status(200).json({ isValidUsername: true })
}

const handleTunneling = (req, res) => {
  // Redirecting all requests from requester to client localhost
  const { username } = req.params
  const clientSocket = findClientSocketByUsername(username)
  if (!clientSocket)
    return res.status(404).json({ message: 'Client not available' }) // TODO: 404 html

  const { files = [] } = req,
    unique_id = uid(),
    requestId = unique_id, // TODO: `REQUEST.${unique_id}`
    { method, headers, body } = req,
    path = req.url.replace(`/${username}`, ''),
    fileName =
      parseUrl(path).path === '/' ? 'index.html' : path.split('/').pop()

  const request = {
    requestId, // TODO: unique_id
    path,
    method,
    headers,
    body // TODO: stream
  }
  clientSocket.emit('request', request)
  // TODO: event
  files.forEach(file => clientSocket.emit(requestId, file)) // TODO: stream
  clientSocket.emit(requestId, { data: 'DONE' })

  // Redirecting all client localhost responses to requester
  const responseId = requestId // TODO: `RESPONSE.${unique_id}`
  let responseLength = 0
  const continueReceivingData = () => clientSocket.emit(responseId)

  const onClientSocketResponse = clientSocketResponse => {
    const { status, headers, data, dataByteLength } = clientSocketResponse

    if (data) {
      if (typeof data === 'string' && data === 'DONE') {
        // All data received. Stop receiving more
        clientSocket.removeAllListeners(responseId)
        return res.end()
      }

      // Continue receiving data if data buffer is not full
      // Else pause until data buffer is drained
      if (res.write(data)) continueReceivingData()
      else res.on('drain', continueReceivingData)

      if (process.env.NODE_ENV !== 'production') {
        responseLength += Buffer.byteLength(data, 'binary')
        log(method, `${username}${path}`, byteToString(responseLength))
      }
      return
    }

    // Set headers from status, headers, dataByteLength
    res.status(status)
    res.set({
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Last-Modified': headers['last-modified'] || new Date().toUTCString(),
      'Cache-Control': headers['cache-control'] || 'public, max-age=0',
      'Content-Length': headers['content-length'] || dataByteLength,
      'Etag': headers['etag']
    }) // TODO: {...headers}
    res.contentType(headers['content-type'] || fileName)
    continueReceivingData()
  }
  clientSocket.on(responseId, onClientSocketResponse)
}

const testTunnel = (req, res) => {
  req.on('data', chunk => log('req not parsed yet\n', chunk))

  const { body, files } = req
  Object.keys(body).forEach(key => {
    const value = body[key]
    if (value.length > 125) body[key] = `${value.slice(0, 125)} --->`
  })
  log('----------------\nbody\n----------------\n', body)
  if (files) log('----------------\nfiles\n----------------\n', files)
  res.sendStatus(200)
}

module.exports = { validateUsername, handleTunneling, testTunnel }
