/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

const { log } = require('../helpers')
const {
  getClientSocketCount,
  addClientSocket,
  removeClientSocket
} = require('../models/ClientSocket')

/** @param {SocketIO.Socket} socket */
const socketOnUsername = socket =>
  /** @param {string} username */
  username => {
    socket.removeAllListeners('username')
    socket.username = username
    addClientSocket(socket)
    const clientSocketCount = getClientSocketCount()
    log(`Joined ${socket.id} ${username} Total users: ${clientSocketCount}`)
  }

/** @param {SocketIO.Socket} socket */
const socketOnDisconnect = socket => () => {
  removeClientSocket(socket.id)
  socket.removeAllListeners()
  socket.disconnect(true)
  const socketCount = getClientSocketCount()
  log(`Left ${socket.id} ${socket.username} Total users: ${socketCount}`)
}

/** @param {SocketIO.Socket} socket */
const onNewSocketConnection = socket => {
  socket.on('username', socketOnUsername(socket))
  socket.on('disconnect', socketOnDisconnect(socket))
}

/** @param {SocketIO.Socket} socket */
const onWatchSocketConnection = socket => log('visited', socket.client.id)

module.exports = { onNewSocketConnection, onWatchSocketConnection }
