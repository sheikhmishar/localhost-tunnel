/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

const socketIo = require('socket.io')
const express = require('express')
const cors = require('cors')
const path = require('path')
const http = require('http')
const router = require('./controllers/routes')
const middlewares = require('./controllers/middlewares')
const sockets = require('./controllers/socket')

const app = express()
const server = http.createServer(app)
const viewsDir = path.join(__dirname, './views/build')
const vendorDir = path.join(__dirname, './views/src/js/vendor')
const socketIoClientDir = path.join(
  __dirname,
  './node_modules/socket.io-client/dist'
)
/** @type {Express.Cors.Options} */
const corsConfig = {
  credentials: true,
  optionsSuccessStatus: 204,
  origin: true,
  maxAge: 60 * 60,
  exposedHeaders: '*,authorization'
}
const corsInstance = cors(corsConfig)
// @ts-ignore
const io = socketIo(server, {
  path: '/sock',
  serveClient: false,
  handlePreflightRequest: middlewares.ioPreflight
})

if (process.env.NODE_ENV !== 'production') {
  const logger = require('morgan')('dev')
  app.use(middlewares.headersInspector)
  app.use(logger)
}
app.disable('x-powered-by')
app.use(corsInstance)
app.use('/io', express.static(socketIoClientDir))
app.use(express.static(viewsDir))
app.use(express.static(vendorDir))
app.use(express.raw())
app.use(router)
app.use(middlewares.unknownRouteHandler)
app.use(middlewares.expressErrorHandler)

const { PORT = 5000 } = process.env
server.listen(PORT, () => console.log(`Server port ${PORT}`))

const { onNewSocketConnection, onWatchSocketConnection } = sockets
io.of('/tunnel').on('connection', onNewSocketConnection)
if (process.env.NODE_ENV !== 'production') {
  io.of('/watch').on('connection', onWatchSocketConnection)
  const refreshClients = () => io.of('/watch').emit('refresh')
  require('fs').watch(viewsDir, { recursive: true }, () =>
    setTimeout(refreshClients, 500)
  )
}
