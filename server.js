/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

const ioClient = require('socket.io-client')
const socketIo = require('socket.io')
const express = require('express')
const debugp = require('debug')
const cors = require('cors')
const path = require('path')
const http = require('http')
const fs = require('fs')
const globals = require('./globals')
const router = require('./controllers/routes')
const sockets = require('./controllers/socket')
const middlewares = require('./controllers/middlewares')

const debug = debugp('server')
const app = express()
const server = http.createServer(app)
const viewsDir = path.join(__dirname, './views/build')
const vendorDir = path.join(__dirname, './views/src/js/vendor')
const corsInstance = cors(globals.corsConfig)
const io = socketIo(server, globals.socketIoConfig)
const { TRACKER_IP = '127.0.0.1', TRACKER_PORT = 5100 } = process.env
const trackerAddr = `ws://${TRACKER_IP}:${TRACKER_PORT}/list`
const socketIoClientDir = path.join(
  __dirname,
  './node_modules/socket.io-client/dist'
)

if (process.env.NODE_ENV !== 'production') {
  const logger = require('morgan')('dev')
  app.use(middlewares.headersInspector)
  app.use(logger)
}
app.set('name', 'localhost-tunnel')
app.disable('x-powered-by')
app.use(corsInstance)
app.use(express.static(socketIoClientDir))
app.use(express.static(viewsDir))
app.use(express.static(vendorDir))
app.use(express.raw())
app.use(router)
app.use(middlewares.unknownRouteHandler)
app.use(middlewares.expressErrorHandler)

let PORT = parseInt(process.env.PORT) || 5000
const IP = process.env.IP || '127.0.0.1'

const onServerListening = () => {
  debug('Server listening on:', server.address())

  const address = `http://${IP}:${PORT}`
  globals.serverAddress = address

  const trackerSocket = ioClient(trackerAddr, { path: '/list' })
  globals.trackerSocket = trackerSocket
  sockets.attachTrackerCallbacks()
}

const onServerError = err => {
  if (err.code === 'EADDRINUSE') {
    debug(`Port ${PORT} in use. Retrying with port ${++PORT}...`)

    server.close()
    globals.serverAddress = null

    setTimeout(() => server.listen(PORT, IP), 1000)
  }
}

server.listen(PORT, IP)
server.on('listening', onServerListening)
server.on('error', onServerError)

const tunnelChannel = io.of('/tunnel')
tunnelChannel.on('connection', sockets.onTunnelServerConnection)

if (process.env.NODE_ENV !== 'production') {
  const watchChannel = io.of('/watch')
  watchChannel.on('connection', sockets.onWatchServerConnection)

  fs.watch(viewsDir, { recursive: true }, () =>
    setTimeout(() => watchChannel.emit('refresh'), 500)
  )
}
