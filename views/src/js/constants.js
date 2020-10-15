export const streamChunkSize = 1024 * 1024 * 2, // 2MB
  maxStreamSize = 1024 * 1024 * 1024, // 1GB
  maxLogLength = 20

// Server variables
export const serverURL = location.host,
  serverProtocol = location.protocol || 'http:',
  socketProtocol = serverProtocol === 'http:' ? 'ws:' : 'wss:',
  validatorURL = `${serverProtocol}//${serverURL}/validateusername`,
  socketTunnelURL = `${socketProtocol}//${serverURL}/tunnel`,
  socketWatchURL = `${socketProtocol}//${serverURL}/watch`,
  isLocalhostRoot =
    location.hostname === 'localhost' && location.origin + '/' === location.href

// IF :PORT, then /username/path,
// ELSE username.domain.ext/path
