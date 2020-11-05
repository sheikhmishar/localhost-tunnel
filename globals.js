/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

const middlewares = require('./controllers/middlewares')

/** @type {SocketIOClient.Socket} */
const trackerSocket = null

/** @type {string} http://ipv4:port */
const serverAddress = null

/** @type {Express.Cors.Options} */
const corsConfig = {
  credentials: true,
  optionsSuccessStatus: 204,
  origin: true,
  maxAge: 60 * 60,
  exposedHeaders: ['*', 'authorization']
}

/** @type {SocketIO.ServerOptions} */
const socketIoConfig = {
  path: '/sock',
  serveClient: false,
  // @ts-ignore
  handlePreflightRequest: middlewares.ioPreflight
}

module.exports = {
  trackerSocket,
  corsConfig,
  serverAddress,
  socketIoConfig
}
