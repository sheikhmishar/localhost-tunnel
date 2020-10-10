let clientSockets = []

const getClientSockets = () => clientSockets

const getClientSocketCount = () => clientSockets.length

const getClientSocketsSummary = () =>
  clientSockets.forEach(socket => console.log(socket.id, socket.username))

/** @param {string} clientUsername
 *  @returns {SocketIO.Socket} */
const findClientSocketByUsername = clientUsername =>
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
  findClientSocketByUsername,
  addClientSocket,
  removeClientSocket
}

module.exports = ClientSocket
