const { log } = require('../helpers')
const {
  getClientSocketCount,
  addClientSocket,
  removeClientSocket
} = require('../models/ClientSocket')

const onNewSocketConnection = socket => {
  socket.on('username', username => {
    socket.removeAllListeners('username')
    socket.username = username
    addClientSocket(socket)
    const clientSocketCount = getClientSocketCount()
    log(`Joined ${socket.id} ${username} Total users: ${clientSocketCount}`)
  })
  socket.on('disconnect', () => {
    removeClientSocket(socket.id)
    socket.removeAllListeners()
    socket.disconnect(true)
    const socketCount = getClientSocketCount()
    log(`Left ${socket.id} ${socket.username} Total users: ${socketCount}`)
  })
}

const onWatchSocketConnection = socket => log('visited', socket.client.id)

const setupSocket = (io, viewsDir) => {
  io.of('/tunnel').on('connection', onNewSocketConnection)

  if (process.env.NODE_ENV !== 'production') {
    io.of('/watch').on('connection', onWatchSocketConnection)
    require('fs').watch(viewsDir, { recursive: true }, () =>
      io.of('/watch').emit('refresh')
    )
  }
}

module.exports = { setupSocket }
