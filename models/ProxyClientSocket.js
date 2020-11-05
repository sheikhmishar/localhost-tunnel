/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

const debug = require('debug')('server:model:proxysocket')
const getProxyMiddleware = require('../controllers/middlewares/proxy')

/** @type {upstreamInfo} */
let upstreams = {}

/** @param {upstreamInfo} u */
const initUpstreams = u => {
  debug('INIT', u)

  upstreams = u

  for (const [id, { address }] of Object.entries(upstreams))
    if (!address) debug('NO ADDRESS DEL', id, delete upstreams[id])
    else upstreams[id].proxyMiddleware = getProxyMiddleware(address)
}

/** @param {string} upstreamId @param {string} address */
const addUpstream = (upstreamId, address) => {
  debug('SERVER SOCKET', upstreamId, 'ADDRESS', address)

  upstreams[upstreamId] = { subs: [] }
  upstreams[upstreamId].address = address
  upstreams[upstreamId].proxyMiddleware = getProxyMiddleware(address)
}

/** @param {string} upstreamId */
const removeUpstream = upstreamId => {
  debug('SERVER SOCKET', upstreamId, 'DISCONNECTED')

  delete upstreams[upstreamId]
}

/** @param {string} username */
const findClientProxy = username => {
  for (const { subs, proxyMiddleware } of Object.values(upstreams))
    if (subs.includes(username)) return proxyMiddleware
  return null
}

/** @param {string} username // TODO */
const findClientAddress = username => {
  for (const { subs, address } of Object.values(upstreams))
    if (subs.includes(username)) return address
  return null
}

/** @param {string} upstreamId @param {string} username */
const addProxyClient = (upstreamId, username) => {
  debug(username, 'CONNECTED TO SERVER', upstreamId)

  upstreams[upstreamId].subs.push(username)
}

/** @param {string} upstreamId @param {string} username */
const removeProxyClient = (upstreamId, username) => {
  debug(username, 'DISCONNECTED FROM SERVER', upstreamId)

  const { subs } = upstreams[upstreamId]
  upstreams[upstreamId].subs = subs.filter(name => name !== username)
}

module.exports = {
  initUpstreams,
  addUpstream,
  removeUpstream,
  findClientProxy,
  addProxyClient,
  removeProxyClient
}
