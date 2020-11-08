/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

const debug = require('debug')('server:controllers:socket')
const globals = require('../globals')
const {
  getClientSockets,
  getClientSocketCount,
  addClientSocket,
  removeClientSocket
} = require('../models/NativeClientSocket')
const {
  getAllUpstreams,
  addProxyClient,
  addUpstream,
  initUpstreams,
  removeProxyClient,
  removeUpstream
} = require('../models/ProxyClientSocket')

/** @type {(socket: SocketIO.Socket) => (username: string) => void} */
const socketOnUsername = socket => username => {
  globals.trackerSocket.emit('upstream_subs_join', username)

  socket.removeAllListeners('username')
  socket.username = username
  addClientSocket(socket)
  const clientSocketCount = getClientSocketCount()
  debug(`Joined ${socket.id} ${username} Total users: ${clientSocketCount}`)
}

/** @param {SocketIO.Socket} socket */
const socketOnDisconnect = socket => () => {
  globals.trackerSocket.emit('upstream_subs_leave', socket.username)

  removeClientSocket(socket.id)
  socket.removeAllListeners()
  socket.disconnect(true)
  const socketCount = getClientSocketCount()
  debug(`Left ${socket.id} ${socket.username} Total users: ${socketCount}`)
}

/** @param {SocketIO.Socket} socket */
const onTunnelServerConnection = socket => {
  socket.on('username', socketOnUsername(socket))
  socket.on('disconnect', socketOnDisconnect(socket))
}

/** @param {SocketIO.Socket} socket */
const onWatchServerConnection = socket => debug('visited', socket.client.id)

const trackerOnConnect = () => {
  const tracker = globals.trackerSocket

  tracker.emit('upstream_join', globals.serverAddress)
  for (const { username } of getClientSockets())
    if (username) tracker.emit('upstream_subs_join', username)
}

const attachTrackerCallbacks = () => {
  const tracker = globals.trackerSocket

  tracker.on('connect', trackerOnConnect)
  tracker.on('init', initUpstreams)
  tracker.on('upstream_join', addUpstream)
  tracker.on('upstream_leave', removeUpstream)
  tracker.on('upstream_subs_join', addProxyClient)
  tracker.on('upstream_subs_leave', removeProxyClient)
}

/** @type {Express.RequestHandler} */
const getTrackerListenerCount = (_, res) => {
  const tracker = globals.trackerSocket
  res.json({
    listenersCount: {
      connect: tracker.listeners('connect').length,
      init: tracker.listeners('init').length,
      upstream_join: tracker.listeners('upstream_join').length,
      upstream_leave: tracker.listeners('upstream_leave').length,
      upstream_subs_join: tracker.listeners('upstream_subs_join').length,
      upstream_subs_leave: tracker.listeners('upstream_subs_leave').length
    }
  })
}

/** @type {Express.RequestHandler} */
const getSocketsSummary = (_, res) => {
  const clientSockets = getClientSockets()
  const summary = clientSockets.map(
    ({ connected, handshake, rooms, username }, i) => ({
      username,
      connected,
      handshake,
      rooms,
      listenerCount: {
        username: clientSockets[i].listenerCount('username'),
        disconnect: clientSockets[i].listenerCount('disconnect')
      }
    })
  )
  res.json(summary)
}

/** @type {Express.RequestHandler} */
const getProxiesSummary = (_, res) => {
  const upstreams = getAllUpstreams()
  for (const upstream in upstreams) delete upstreams[upstream].proxyMiddleware
  res.json(upstreams)
}

module.exports = {
  onTunnelServerConnection,
  onWatchServerConnection,
  attachTrackerCallbacks,
  getSocketsSummary,
  getProxiesSummary,
  getTrackerListenerCount
}
