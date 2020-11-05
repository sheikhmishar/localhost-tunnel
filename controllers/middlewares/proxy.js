/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

const { createProxyMiddleware } = require('http-proxy-middleware')
const debug = require('debug')('tracker:proxy')
const chalk = require('chalk')
const { prettyJson } = require('../../helpers')

/** @type {Express.ErrorRequestHandler} */
const proxyOnError = (err, req, res) => {
  debug('ERR\n', chalk.red(prettyJson(err)))
  debug('REQ\n', chalk.green(prettyJson(req.headers)))
  res.status(500).json({ message: '500 Upstream Error' })
}

const proxyLogConfig = {
  log: debug,
  debug: debug,
  info: debug,
  warn: debug,
  error: debug
}

const proxyLogProvider = _ => proxyLogConfig

/** @param {string} address */
const getProxyMiddleware = address =>
  // @ts-ignore
  createProxyMiddleware({
    target: address,
    preserveHeaderKeyCase: true,
    followRedirects: false,
    changeOrigin: true,
    xfwd: true,
    ws: true,
    logLevel: 'debug',
    onError: proxyOnError,
    logProvider: proxyLogProvider
  })

module.exports = getProxyMiddleware
