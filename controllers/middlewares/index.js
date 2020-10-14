/** @type {Chalk} */ let chalk
if (process.env.NODE_ENV !== 'production') {
  chalk = require('../../views/node_modules/chalk').default
}

/** @type {Express.RequestHandler} */
const headersInspector = (req, _, next) => {
  const headers = JSON.stringify(req.headers, null, 2)
  console.log(chalk.greenBright(headers))
  console.log(chalk.redBright(req.path))
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

module.exports = { headersInspector, expressErrorHandler, unknownRouteHandler }
