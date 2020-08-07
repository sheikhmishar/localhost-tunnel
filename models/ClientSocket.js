let clientSockets = []

const getClientSockets = () => clientSockets,
  getClientSocketCount = () => clientSockets.length,
  getClientSocketsSummary = () =>
    clientSockets.forEach(socket => console.log(socket.id, socket.username)),
  findClientSocketByUsername = clientUsername =>
    clientSockets.find(({ username }) => username === clientUsername),
  addClientSocket = clientSocket => clientSockets.push(clientSocket),
  removeClientSocket = clientSocketId =>
    (clientSockets = clientSockets.filter(({ id }) => id !== clientSocketId))

module.exports = {
  getClientSockets,
  getClientSocketsSummary,
  getClientSocketCount,
  findClientSocketByUsername,
  addClientSocket,
  removeClientSocket
}
