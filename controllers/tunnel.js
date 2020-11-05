/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

const { findClientSocket } = require('../models/NativeClientSocket')
const { findClientProxy } = require('../models/ProxyClientSocket')
const { byteToString, sanitizeHeaders } = require('../helpers')
const uid = /** @type {() => string} */ (require('uuid').v1)
const debug = require('debug')('server:controllers:tunnel')

/** @type {Express.RequestHandler} */
const validateUsername = (req, res) => {
  const { username } = req.body
  if (findClientSocket(username) || findClientProxy(username))
    res.status(400).json({ isValidUsername: false })
  else res.status(200).json({ isValidUsername: true })
}

/** @type {Express.RequestHandler} */
const handleTunneling = (req, res, next) => {
  // Redirecting all requests from requester to client localhost
  const { username } = req.params
  const clientSocket = findClientSocket(username)
  if (!clientSocket) {
    const clientProxy = findClientProxy(username)
    if (!clientProxy)
      return res.status(404).json({ message: 'Client not available' })
      
    return clientProxy(req, res, next)
  }

  const files = /**@type {Express.Multer.File[]} */ (req.files || []),
    uniqueId = uid(),
    requestId = uniqueId, // TODO: `REQUEST.${uniqueId}`
    {
      params: { 0: pathname },
      method,
      body,
      _parsedUrl: { search: query }
    } = req,
    headers = sanitizeHeaders(req.headers),
    path = `/${pathname}${query || ''}`,
    fileName = `/${pathname}`.endsWith('/')
      ? 'index.html'
      : path.split('/').pop()

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
  const continueReceivingData = () => clientSocket.emit(responseId, true)
  /** @param {string} eventName EventName*/
  const stopReceivingData = eventName => () => {
    res.removeAllListeners('error')
    res.removeAllListeners('close')
    res.removeAllListeners('finish')

    debug('STOP res', eventName, res.req.originalUrl, responseId)
    if (clientSocket.listeners(responseId).length) {
      clientSocket.emit(responseId, false)
      clientSocket.removeAllListeners(responseId)
    }
  }

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

      res.once('error', stopReceivingData('error'))
      res.once('close', stopReceivingData('close'))
      res.once('finish', stopReceivingData('finish'))

      if (process.env.NODE_ENV !== 'production') {
        responseLength += Buffer.byteLength(data, 'binary')
        debug(method, `${username}${path}`, byteToString(responseLength))
      }
      return
    }

    // Set headers from status, headers, dataByteLength
    res.status(status)
    res.set(headers)
    res.set('Content-Disposition', `inline; filename="${fileName}"`)
    res.contentType(headers['content-type'] || fileName)

    if (!res.hasHeader('Content-Length') && dataByteLength)
      res.set('Content-Length', dataByteLength.toString())

    continueReceivingData()
  }
  clientSocket.on(responseId, onClientSocketResponse)
}

/** @type {Express.RequestHandler} */
const testTunnel = (req, res) => {
  req.on('data', chunk => debug('req not parsed yet\n', chunk))

  const { body, files } = req
  Object.keys(body).forEach(key => {
    const value = body[key]
    if (value.length > 125) body[key] = `${value.slice(0, 125)} --->`
  })
  debug('----------------\nbody\n----------------\n', body)
  if (files) debug('----------------\nfiles\n----------------\n', files)
  res.sendStatus(200)
}

module.exports = { validateUsername, handleTunneling, testTunnel }
