/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

/** @type {Chalk} */ let chalk
if (process.env.NODE_ENV !== 'production') chalk = require('chalk')

/** @type {Express.RequestHandler} */
const headersInspector = (req, _, next) => {
  const headers = JSON.stringify(req.headers, null, 2)
  console.log(chalk.greenBright(headers))
  next()
}

/** @type {Express.RequestHandler} */
const unknownRouteHandler = (_, res) =>
  res.status(404).json({ message: '404 Invalid Route' })

/** @type {Express.ErrorRequestHandler} */
const expressErrorHandler = (err, _, res, __) => {
  if (process.env.NODE_ENV !== 'production') console.error(chalk.red(err))
  res.status(500).json({ message: '500 Internal Server Error' })
}

/** @param {HTTP.IncomingMessage} req @param {HTTP.ServerResponse} res */
const ioPreflight = (req, res) => {
  res.writeHead(200, {
    'Access-Control-Allow-Headers':
      req.headers['access-control-request-headers'],
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
