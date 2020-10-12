const { findClientSocketByUsername } = require('../models/ClientSocket')
const uid = /** @type {() => string} */ (require('uuid').v1)
const { byteToString, log, sanitizeHeaders } = require('../helpers')

/** @type {Express.RequestHandler} */
const validateUsername = (req, res) => {
  if (findClientSocketByUsername(req.body.username))
    res.status(400).json({ isValidUsername: false })
  else res.status(200).json({ isValidUsername: true })
}

/** @type {Express.RequestHandler} */
const handleTunneling = (req, res) => {
  // Redirecting all requests from requester to client localhost
  const { username } = req.params
  const clientSocket = findClientSocketByUsername(username)
  if (!clientSocket)
    return res.status(404).json({ message: 'Client not available' }) // TODO: 404 html

  const files = /**@type {Express.Multer.File[]} */ (req.files || []),
    unique_id = uid(),
    requestId = unique_id, // TODO: `REQUEST.${unique_id}`
    { method, body } = req,
    headers = sanitizeHeaders(req.headers),
    path = `/${req.params[0]}`,
    fileName = path.endsWith('/') ? 'index.html' : path.split('/').pop()

  /** @type {LocalhostTunnel.ServerRequest} */
  const request = {
    requestId, // TODO: unique_id
    path,
    method: /** @type {HTTPMethods} */ (method),
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

  /** @param {LocalhostTunnel.ClientResponse} clientSocketResponse */
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
      else res.once('drain', continueReceivingData)
      res.once('error', () => log('res err', res.req.originalUrl, responseId)) // TODO: garbage collect client
      res.once('close', () => log('res close', res.req.originalUrl, responseId)) // TODO: garbage collect client
      res.once('finish', () =>
        log('res finish', res.req.originalUrl, responseId)
      ) // TODO: garbage collect client

      if (process.env.NODE_ENV !== 'production') {
        responseLength += Buffer.byteLength(data, 'binary')
        log(method, `${username}${path}`, byteToString(responseLength))
      }
      return
    }

    // Set headers from status, headers, dataByteLength
    res.status(status)
    res.set(headers)
    res.set('Content-Disposition', `inline; filename="${fileName}"`)
    res.contentType(headers['content-type'] || fileName)

    if (!res.hasHeader('Last-Modified'))
      res.set('Last-Modified', new Date().toUTCString())
    if (!res.hasHeader('Cache-Control'))
      res.set('Cache-Control', 'public, max-age=604800')
    if (!res.hasHeader('Content-Length'))
      res.set('Content-Length', dataByteLength.toString())

    continueReceivingData()
  }
  clientSocket.on(responseId, onClientSocketResponse)
}

/** @type {Express.RequestHandler} */
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
