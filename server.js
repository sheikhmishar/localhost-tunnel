const socketIo = require('socket.io')
const express = require('express')
const path = require('path')
const http = require('http')
const router = require('./controllers/routes')
const middlewares = require('./controllers/middlewares')
const sockets = require('./controllers/socket')

const app = express()
const server = http.createServer(app)
const io = socketIo(server, { path: '/sock' })
const viewsDir = path.join(__dirname, 'views', 'build')
const vendorDir = path.join(__dirname, 'views', 'src', 'js', 'vendor')

if (process.env.NODE_ENV !== 'production') app.use(middlewares.headersInspector)
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
