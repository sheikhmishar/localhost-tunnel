/*!
 * localhost-tunnel
 * Copyright(c) 2020 sheikhmishar
 * Copyright(c) 2020 omranjamal
 * GPLv3 Licensed
 */

export const streamChunkSize = 1024 * 1024 * 2, // 2MB
  maxStreamSize = 1024 * 1024 * 1024, // 1GB
  maxLogLength = 20

// Server variables
export const serverURL = location.host,
  hasPort = location.host.includes(':'),
  serverProtocol = location.protocol || 'http:',
  socketProtocol = serverProtocol === 'http:' ? 'ws:' : 'wss:',
  validatorURL = `${serverProtocol}//${serverURL}/validateusername`,
  socketTunnelURL = `${socketProtocol}//${serverURL}/tunnel`,
  socketWatchURL = `${socketProtocol}//${serverURL}/watch`,
  isLocalhostRoot =
    (location.hostname === 'localhost' || location.hostname.includes('.lan')) &&
    location.origin + '/' === location.href
