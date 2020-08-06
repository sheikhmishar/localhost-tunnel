// HTML elements
var usernameInput = document.querySelector('#username-input'),
  portInput = document.querySelector('#port-input'),
  tunnelToggleButton = document.querySelector('#tunnel-toggle-button'),
  logWrapper = document.querySelector('.log-wrapper')

// State variables
var shouldTunnel = false,
  maxLogLength = 20,
  streamChunkSize = 1024 * 1024 * 2 // 2MB

// Server variables
var serverProtocol = 'http',
  serverURL = location.host, // TODO: Will be replaced by deployed server url
  socket

// Helper functions
function intitiateSocket() {
  socket = io.connect('ws://' + serverURL + '/tunnel', { path: '/sock' })
  socket.on('connect', function() {
    socket.emit('username', { username: usernameInput.value })
  })
  socket.on('request', tunnelLocalhostToServer)
}

var forbiddenHeaders = [
    'accept-charset',
    'accept-encoding',
    'access-control-request-headers',
    'access-control-request-method',
    'connection',
    'content-length',
    'cookie',
    'cookie2',
    'date',
    'dnt',
    'expect',
    'feature-policy',
    'host',
    'keep-alive',
    'origin',
    'referer',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'via'
  ],
  forbiddenHeadersSubstrings = ['proxy-', 'sec-']

function sanitizeHeaders(headers) {
  if (typeof headers != 'object') return {}

  var headersToRemove = []
  var headerKeys = Object.keys(headers)
  for (var i = 0; i < headerKeys.length; i++) {
    var currentKey = headerKeys[i],
      currentKeyLowerCase = headerKeys[i].toLowerCase()

    for (var j = 0; j < forbiddenHeaders.length; j++)
      if (currentKeyLowerCase === forbiddenHeaders[j])
        headersToRemove.push(currentKey)

    for (var j = 0; j < forbiddenHeadersSubstrings.length; j++)
      if (currentKeyLowerCase.includes(forbiddenHeadersSubstrings[j]))
        headersToRemove.push(currentKey)
  }

  for (var i = 0; i < headersToRemove.length; i++)
    delete headers[headersToRemove[i]]

  return headers
}

function validateUsername(username) {
  return axios
    .post(serverProtocol + '://' + serverURL + '/validateusername', {
      username: username
    })
    .then(function(res) {
      return res.data.isValidUsername
    })
    .catch(function(err) {
      return false
    })
}

function tunnelLocalhostToServer(serverRequest) {
  var pathname = serverRequest.url,
    responseId = serverRequest.requestId
  makeRequestToLocalhost(serverRequest)
    .catch(function(localhostResponseError) {
      return localhostResponseError.response
    })
    .then(function(localhostResponse) {
      appendLog(
        localhostResponse.config.method.toUpperCase() +
          ' ' +
          localhostResponse.status +
          ' ' +
          generateHyperlink(localhostResponse.config.url) +
          ' -> ' +
          generateHyperlink(
            serverProtocol +
              '://' +
              serverURL +
              '/' +
              usernameInput.value +
              pathname
          )
      )
      sendResponseToServer(localhostResponse, responseId)
    })
    .catch(function(error) {
      sendResponseToServer(
        {
          status: 500,
          headers: serverRequest.headers,
          data: ObjectToArrayBuffer({ message: '505 Error' })
        },
        responseId
      )
    })
}

function makeRequestToLocalhost(req) {
  var url = serverProtocol + '://localhost:' + portInput.value + req.url

  var requestParameters = {
    // headers: {
    //   Accept: req.headers['accept'],
    //   'Accept-Language': req.headers['accept-language']
    // }
    headers: sanitizeHeaders(req.headers),
    method: req.method,
    url: url,
    data: req.data,
    withCredentials: true,
    responseType: 'arraybuffer',
    onUploadProgress: function(progressEvent) {
      console.log(
        'DOWNLOAD ' +
          url +
          ' ' +
          Math.round((progressEvent.loaded * 100) / progressEvent.total) +
          ' %'
      ) // TODO: send chunk by chunk response sendResponsoToServer
    },
    onDownloadProgress: function(e) {
      var loaded = e.loaded

      e.target.start = e.target.end ? e.target.end : 0
      e.target.end = loaded

      var start = e.target.start,
        end = e.target.end,
        total = e.total,
        percent = e.lengthComputable ? Math.round((loaded * 100) / total) : 101

      console.log('UPLOAD', url, start, end, percent, '%')
      /* TODO: send chunk by chunk response sendResponsoToServer
              then if success, send 'DONE' to end stream
      */
    }
  }
  return axios(requestParameters)
}

function sendResponseToServer(localhostResponse, responseId) {
  var status = localhostResponse.status,
    headers = localhostResponse.headers,
    data = localhostResponse.data,
    dataByteLength = data.byteLength

  socket.emit(responseId, {
    status: status,
    headers: headers,
    dataByteLength: dataByteLength
  })

  // TODO: write own array and loop based slice method to handle large files
  var totalChunks = Math.ceil(dataByteLength / streamChunkSize)
  var start = 0,
    end = 0,
    chunk = new ArrayBuffer(0)
  for (var i = 0; i < totalChunks; i++) {
    start = i * streamChunkSize
    end = start + streamChunkSize
    chunk = data.slice(start, end)

    socket.emit(responseId, {
      data: chunk
    })
  }
  socket.emit(responseId, {
    data: 'DONE'
  })
}

function ObjectToArrayBuffer(object) {
  var json = JSON.stringify(object)
  var buffer = new ArrayBuffer(json.length)
  var container = new Uint8Array(buffer)
  for (var i = 0; i < json.length; i++) {
    container[i] = json.charCodeAt(i)
  }
  return buffer
}

// UI helper functions
function generateHyperlink(url) {
  return (
    '<a href="' +
    url +
    '" target="_blank" class="badge badge-info">' +
    url +
    '</a>'
  )
}

function refreshTunnelStatus() {
  if (shouldTunnel) {
    var tunnelUrl =
      serverProtocol + '://' + serverURL + '/' + usernameInput.value + '/'
    appendLog('Tunnel is running at port ' + portInput.value)
    appendLog(
      'Your localhost is now available at ' + generateHyperlink(tunnelUrl)
    ) // TODO: Permanent
    tunnelToggleButton.innerText = 'Stop tunneling'
  } else {
    appendLog('Tunnel is stopped')
    tunnelToggleButton.innerText = 'Start tunneling'
  }
}

function toggleTunnel() {
  shouldTunnel = !shouldTunnel

  if (shouldTunnel) intitiateSocket()
  else socket.disconnect()

  refreshTunnelStatus()
}

function validate(e) {
  e.preventDefault()
  if (!shouldTunnel) validateInputs()
  else toggleTunnel()
}

function validateInputs() {
  var port = portInput.value,
    username = usernameInput.value
  if (port.length < 2) appendLog('Port length must be at least 2')
  else if (port[0] === '0') appendLog('Port cannot start with 0')
  else if (username.length <= 0) appendLog('Username length must be at least 1')
  else if (username.includes('/')) appendLog('Username cannot have /')
  else if (username.includes('.')) appendLog('Username cannot have .')
  else if (username.includes('"')) appendLog('Username cannot have "')
  else if (username.includes("'")) appendLog("Username cannot have '")
  else {
    validateUsername(username).then(function(isValidUsername) {
      if (!isValidUsername) appendLog('Username exists or connection error')
      else toggleTunnel()
    })
  }
}

function appendLog(log, type) {
  var newDomElement = document.createElement('h6')
  newDomElement.setAttribute('class', 'text-primary')
  newDomElement.innerHTML = log
  logWrapper.prepend(newDomElement)

  if (logWrapper.childElementCount > maxLogLength) logWrapper.lastChild.remove()
}

// main
io.connect('ws://' + serverURL + '/watch', { path: '/sock' }).on(
  'refresh',
  function() {
    location.reload()
  }
)
refreshTunnelStatus()
tunnelToggleButton.onclick = validate
