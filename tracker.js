/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

const socketIO = require('socket.io')
const express = require('express')
const debugp = require('debug')
const http = require('http')

const debug = debugp('tracker')
const ioDebug = debugp('tracker:io')

const trackerApp = express()
const trackerServer = http.createServer(trackerApp)
const trackerIo = socketIO(trackerServer, { path: '/list', serveClient: false })
const subslistChannel = trackerIo.of('/list')
const TRACKER_IP = process.env.TRACKER_IP || '127.0.0.1'
const TRACKER_PORT = parseInt(process.env.TRACKER_PORT) || 5100

/** @type {upstreamInfo} */
const upstreamsInfo = {}

/** @type {SocketIO.Socket[]} */
const upstreamSockets = []

/** @type {(upstream: SocketIO.Socket) => (address: string) => void} */
const upstreamOnJoin = upstream => address => {
  ioDebug('SERVER SOCKET', upstream.id, 'ADDRESS', address)

  upstreamsInfo[upstream.id].address = address

  const { [upstream.id]: drop, ...restUpstreamsInfo } = upstreamsInfo
  upstream.emit('init', restUpstreamsInfo)

  for (const u of upstreamSockets) u.emit('upstream_join', upstream.id, address)
  upstreamSockets.push(upstream)
}

/** @type {(upstream: SocketIO.Socket) => () => void} */
const upstreamOnLeave = upstream => () => {
  ioDebug('SERVER SOCKET', upstream.id, 'DISCONNECTED')
  delete upstreamsInfo[upstream.id]

  let upstreamIndex
  for (let i = 0; i < upstreamSockets.length; i++)
    if (upstreamSockets[i].id === upstream.id) upstreamIndex = i
    else upstreamSockets[i].emit('upstream_leave', upstream.id)

  ioDebug('UPSTREAM INDEX', upstreamIndex, upstream.id)
  upstreamSockets.splice(upstreamIndex, 1)
}

/** @type {(upstream: SocketIO.Socket) => (address: string) => void} */
const upstreamOnSubsJoin = upstream => username => {
  ioDebug(username, 'CONNECTED TO SERVER', upstream.id)

  upstreamsInfo[upstream.id].subs.push(username)

  for (const u of upstreamSockets)
    if (u.id !== upstream.id)
      u.emit('upstream_subs_join', upstream.id, username)
}

/** @type {(upstream: SocketIO.Socket) => (address: string) => void} */
const upstreamOnSubsLeave = upstream => username => {
  ioDebug(username, 'DISCONNECTED FROM SERVER', upstream.id)

  const { subs } = upstreamsInfo[upstream.id]
  upstreamsInfo[upstream.id].subs = subs.filter(name => name !== username)

  for (const u of upstreamSockets)
    if (u.id !== upstream.id)
      u.emit('upstream_subs_leave', upstream.id, username)
}

/** @param {SocketIO.Socket} upstream */
const onTrackerIoConnect = upstream => {
  ioDebug('SERVER SOCKET', upstream.id, 'CONNECTED')

  upstreamsInfo[upstream.id] = { subs: [] }

  upstream.on('upstream_join', upstreamOnJoin(upstream))
  upstream.on('disconnect', upstreamOnLeave(upstream)) // upstream_leave
  upstream.on('upstream_subs_join', upstreamOnSubsJoin(upstream))
  upstream.on('upstream_subs_leave', upstreamOnSubsLeave(upstream))
}
subslistChannel.on('connection', onTrackerIoConnect)

/** @type {Express.RequestHandler} */
const getSocketsSummary = (_, res) =>
  res.json(
    upstreamSockets.map(({ connected, handshake, rooms }, i) => ({
      connected,
      handshake,
      rooms,
      listenerCount: {
        join: upstreamSockets[i].listenerCount('upstream_join'),
        disconnect: upstreamSockets[i].listenerCount('disconnect'),
        subs_join: upstreamSockets[i].listenerCount('upstream_subs_join'),
        subs_leave: upstreamSockets[i].listenerCount('upstream_subs_leave')
      }
    }))
  )

/** @param {string} subsName */
const getSubsAddress = subsName => {
  for (const { subs, address } of Object.values(upstreamsInfo))
    if (subs.includes(subsName)) return address
  return null
}

trackerApp.get('/upstreams', (_, res) => res.json(upstreamsInfo))
trackerApp.get('/subs/:name', ({ params: { name } }, res) =>
  res.json({ subscriber_address: getSubsAddress(name) })
)
trackerApp.get('/sockets', getSocketsSummary)

trackerServer
  .listen(TRACKER_PORT, TRACKER_IP)
  .on('listening', () => debug('Server', trackerServer.address()))
  .on('error', err => {
    // @ts-ignore
    if (err.code === 'EADDRINUSE') {
      debug(`Port ${trackerServer.address()} in use. Retry with another one`)
      trackerServer.close()
    }
  })
