/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

const debug = require('debug')('server:middlewares:index')
/** @type {Chalk} */ let chalk
if (process.env.NODE_ENV !== 'production') chalk = require('chalk')
const globals = require('../../globals')

/** @type {Express.RequestHandler} */
const headersInspector = ({ headers }, _, next) => {
  debug(chalk.green(JSON.stringify(headers, null, 2)))
  next()
}

/** @type {Express.RequestHandler} */
const unknownRouteHandler = (_, res) =>
  res.status(404).json({ message: '404 Invalid Route' })

/** @type {Express.ErrorRequestHandler} */
const expressErrorHandler = (err, _, res, __) => {
  if (process.env.NODE_ENV !== 'production') debug(chalk.red(err))
  res.status(500).json({ message: '500 Internal Server Error' })
}

/** @param {HTTP.IncomingMessage} req @param {HTTP.ServerResponse} res */
const ioPreflight = (req, res) => {
  const requestedHeaders = req.headers['access-control-request-headers']
  res.writeHead(200, {
    'Access-Control-Allow-Headers': requestedHeaders,
    'Access-Control-Expose-Headers': requestedHeaders + ',authorization',
    'Access-Control-Allow-Origin': req.headers.origin,
    'Access-Control-Allow-Credentials': 'true'
  })
  res.end()
}

module.exports = {
  headersInspector,
  expressErrorHandler,
  unknownRouteHandler,
  ioPreflight
}
