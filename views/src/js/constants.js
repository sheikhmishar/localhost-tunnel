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
  serverPORT = parseInt(location.port),
  noSubdomain =
    serverURL === 'localhost' ||
    serverURL.match(/\d+\.\d+\.\d+\.\d+/) ||
    (serverPORT && serverPORT !== 8080),
  serverProtocol = location.protocol || 'http:',
  socketProtocol = serverProtocol === 'http:' ? 'ws:' : 'wss:',
  validatorURL = `${serverProtocol}//${serverURL}/validateusername`,
  socketTunnelURL = `${socketProtocol}//${serverURL}/tunnel`,
  socketWatchURL = `${socketProtocol}//${serverURL}/watch`,
  isLocalhostRoot =
    location.hostname.match(/(\.lan)|(localhost)/) &&
    location.origin + '/' === location.href
