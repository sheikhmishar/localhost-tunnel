const express = require('express')
const path = require('path')
const app = express()
const viewsDir = path.join(__dirname, 'views', 'build')
const vendorDir = path.join(__dirname, 'views', 'src', 'js', 'vendor')
const { raw, static } = express

/** @type {Chalk} */
let chalk
if (process.env.NODE_ENV !== 'production') {
  chalk = require('./views/node_modules/chalk').default
  app.use((req, _, next) => {
    const headers = JSON.stringify(req.headers, null, 2)
    console.log(chalk.greenBright(headers))
    next()
  })
}

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
    if (process.env.NODE_ENV !== 'production') console.error(chalk.red(err))
    res.status(500).json({ message: '500 Internal Server Error' })
  }
)

const { PORT = 5000 } = process.env
const server = app.listen(PORT, () => console.log(`Server port ${PORT}`))
const io = require('socket.io')(server, { path: '/sock' })
require('./controllers/socket').setupSocket(io, viewsDir)
