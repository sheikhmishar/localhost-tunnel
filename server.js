const express = require('express')
const app = express()

const viewsDir = require('path').join(__dirname, 'views')
const { raw, static } = express
app.use(static(viewsDir))
app.use(raw())

const router = require('./routes')
app.use(router)

app.get('/ping', (req, res) =>
  res.status(200).json({ message: 'Server is alive' })
)

app.use((req, res, next) =>
  res.status(404).json({ message: '404 Invalid Route' })
)

app.use((err, req, res, next) =>
  res.status(500).json({ message: '500 Internal Server Error' })
)

const PORT = process.env.PORT || 5000
const server = app.listen(PORT, () => console.log(`Server port ${PORT}`))
const io = require('socket.io')(server, { path: '/sock' })
require('./controllers/socket').setupSocket(io, viewsDir)
