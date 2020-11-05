/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

const debug = require('debug')('server:model:nativesocket')

let clientSockets = []

const getClientSockets = () => clientSockets

const getClientSocketCount = () => clientSockets.length

const getClientSocketsSummary = () =>
  clientSockets.forEach(socket => debug(socket.id, socket.username))

/** @param {string} clientUsername
 *  @returns {SocketIO.Socket} */
const findClientSocket = clientUsername =>
  clientSockets.find(({ username }) => username === clientUsername)

/** @param {SocketIO.Socket} clientSocket */
const addClientSocket = clientSocket => clientSockets.push(clientSocket)

/** @param {string} clientSocketId
 *  @returns {SocketIO.Socket[]} */
const removeClientSocket = clientSocketId =>
  (clientSockets = clientSockets.filter(({ id }) => id !== clientSocketId))

const ClientSocket = {
  getClientSockets,
  getClientSocketsSummary,
  getClientSocketCount,
  findClientSocket,
  addClientSocket,
  removeClientSocket
}

module.exports = ClientSocket
