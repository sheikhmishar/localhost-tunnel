/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

const debug = require('debug')('server:controllers:socket')
const globals = require('../globals')
const {
  getClientSocketCount,
  addClientSocket,
  removeClientSocket
} = require('../models/NativeClientSocket')
const {
  addProxyClient,
  addUpstream,
  initUpstreams,
  removeProxyClient,
  removeUpstream
} = require('../models/ProxyClientSocket')

/** @param {SocketIO.Socket} socket */
const socketOnUsername = socket =>
  /** @param {string} username */
  username => {
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

const onTrackerClientConnection = () => {
  const tracker = globals.trackerSocket
  tracker.emit('upstream_join', globals.serverAddress)

  tracker.on('init', initUpstreams)
  tracker.on('upstream_join', addUpstream)
  tracker.on('upstream_leave', removeUpstream)
  tracker.on('upstream_subs_join', addProxyClient)
  tracker.on('upstream_subs_leave', removeProxyClient)
}

module.exports = {
  onTunnelServerConnection,
  onWatchServerConnection,
  onTrackerClientConnection
}
