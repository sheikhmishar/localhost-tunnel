const express = require('express')
const path = require('path')
const app = express()

const viewsDir = path.join(__dirname, 'views', 'build')
const vendorDir = path.join(__dirname, 'views', 'src', 'js', 'vendor')
const { raw, static } = express
app.use(static(viewsDir))
app.use(static(vendorDir))
app.use(raw())

const router = require('./controllers/routes')
app.use(router)

app.get('/ping', (_, res) => res.status(200).json({ message: 'Server alive' }))

app.use((_, res, __) => res.status(404).json({ message: '404 Invalid Route' }))

app.use(
  /** @type {Express.ErrorRequestHandler} */
  (err, _, res, __) => {
    console.error(err)
    res.status(500).json({ message: '500 Internal Server Error' })
  }
)

const { PORT = 5000 } = process.env
const server = app.listen(PORT, () => console.log(`Server port ${PORT}`))
const io = require('socket.io')(server, { path: '/sock' })
require('./controllers/socket').setupSocket(io, viewsDir)
