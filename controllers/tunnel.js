const { findClientSocketByUsername } = require('../models/ClientSocket')
const { byteToString, log } = require('../helpers')
const { parse: parseUrl } = require('url')
const { v1: uid } = require('uuid')

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
    body // TODO: stream
  }
  clientSocket.emit('request', request)
  files.forEach(file => clientSocket.emit(requestId, file))
  clientSocket.emit(requestId, { data: 'DONE' })

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
