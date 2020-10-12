const express = require('express')
const path = require('path')
const router = require('./controllers/routes')
const middlewares = require('./controllers/middlewares')
const socketIo = require('socket.io')

const app = express()
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
const server = app.listen(PORT, () => console.log(`Server port ${PORT}`))
const io = socketIo(server, { path: '/sock' })
require('./controllers/socket').setupSocket(io, viewsDir)
