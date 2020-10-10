// TODO: write in modern ES6 and transpile via babel

// HTML elements
var usernameInput = document.getElementById('username-input'),
  portInput = document.getElementById('port-input'),
  tunnelToggleButton = document.getElementById('tunnel-toggle-button'),
  logWrapper = document.getElementsByClassName('log-wrapper')[0]

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
    socket.emit('username', usernameInput.value)
  })
  socket.on('request', preprocessRequest)
}

var forbiddenHeaders = [
    // TODO: recheck
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
    'user-agent',
    'via'
  ],
  forbiddenHeadersSubstrings = ['proxy-', 'sec-']

function sanitizeHeaders(headers) {
  // TODO: capitalize
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
    .catch(function() {
      return false
    })
}

function containsFormdata(headers) {
  return (
    (headers['content-type'] &&
      headers['content-type'].includes('multipart/form-data')) ||
    (headers['Content-Type'] &&
      headers['Content-Type'].includes('multipart/form-data'))
  )
}

function printCurrentProgress(e, url) {
  var loaded = e.loaded

  e.target.start = e.target.end ? e.target.end : 0
  e.target.end = loaded

  var start = e.target.start,
    end = e.target.end,
    total = e.total,
    percent = e.lengthComputable ? Math.round((loaded * 100) / total) : 101,
    type = e.target.responseURL ? 'UPLOAD' : 'DOWNLOAD'

  console.log(type, url, start, end, percent, '%')
  /* TODO: get chunked response using fetch API.
      Then if success, send 'DONE' to end stream via socket */
}

function preprocessRequest(serverRequest) {
  var formadataId = serverRequest.requestId

  var receivedFiles = []
  // , i = 0
  socket.on(formadataId, function(file) {
    if (file.data && file.data === 'DONE') {
      socket.removeAllListeners(formadataId)
      serverRequest.files = receivedFiles
      // i++

      return tunnelLocalhostToServer(serverRequest)
    }

    receivedFiles.push(file)

    // TODO: chunk push and add acknowledgement delay
    // if (file.buffer) appendBuffer(receivedFiles[i].buffer, file.buffer)
    // else {
    //   receivedFiles[i] = file
    //   receivedFiles[i].buffer = new ArrayBuffer(file.size)
    // }
  })
}

function makeRequestToLocalhost(req) {
  var url = serverProtocol + '://localhost:' + portInput.value + req.path
  var headers = sanitizeHeaders(req.headers)

  var data
  if (containsFormdata(headers)) data = getFormdata(req)
  else data = req.body

  var requestParameters = {
    headers: headers,
    method: req.method,
    url: url,
    data: data,
    withCredentials: true,
    responseType: 'arraybuffer',
    onUploadProgress: function(e) {
      printCurrentProgress(e, url)
    },
    onDownloadProgress: function(e) {
      printCurrentProgress(e, url)
    }
  }
  return axios(requestParameters)
}

function tunnelLocalhostToServer(serverRequest) {
  var path = serverRequest.path,
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
              path
          )
      )
      sendResponseToServer(localhostResponse, responseId)
    })
    .catch(function() {
      sendResponseToServer(
        {
          status: 500,
          headers: serverRequest.headers,
          data: objectToArrayBuffer({ message: '505 Client Error' })
        },
        responseId
      )
    })
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

  var totalChunks = Math.ceil(dataByteLength / streamChunkSize)
  var start,
    end,
    chunk,
    i = 0

  // TODO: on ('CONTINUE.id')
  socket.on(responseId, sendChunkedResponse)
  function sendChunkedResponse() {
    if (i === totalChunks) {
      socket.emit(responseId, {
        data: 'DONE'
      })
      return socket.removeAllListeners(responseId)
    }

    start = i * streamChunkSize
    end = start + streamChunkSize
    chunk = data.slice(start, end)

    socket.emit(responseId, {
      data: chunk
    })

    i++
  }
}

function getFormdata(req) {
  var fieldNames = Object.keys(req.body)
  var fieldName, file, mime, fileName

  var data = new FormData()
  for (let i = 0; i < fieldNames.length; i++) {
    fieldName = fieldNames[i]
    data.append(fieldName, req.body[fieldName])
  }

  for (let i = 0; i < req.files.length; i++) {
    file = req.files[i]
    fieldName = file.fieldname
    mime = file.mimetype
    fileName = file.originalname
    data.append(fieldName, new Blob([file.buffer], { type: mime }), fileName)
  }

  return data
}

function objectToArrayBuffer(object) {
  var json = JSON.stringify(object)
  var buffer = new ArrayBuffer(json.length)
  var bufferView = new Uint8Array(buffer)
  for (var i = 0; i < json.length; i++) bufferView[i] = json.charCodeAt(i)

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
    ) // TODO: Permanently view current tunnel address
    tunnelToggleButton.innerText = 'Stop tunneling'
  } else {
    appendLog('Tunnel is stopped')
    tunnelToggleButton.innerText = 'Start tunneling'
  }
}

function disableInputs() {
  usernameInput.setAttribute('disabled', 'true')
  portInput.setAttribute('disabled', 'true')
}

function enableInputs() {
  usernameInput.removeAttribute('disabled')
  portInput.removeAttribute('disabled')
}

function toggleTunnel() {
  shouldTunnel = !shouldTunnel

  if (shouldTunnel) intitiateSocket()
  else socket.disconnect()

  refreshTunnelStatus()
}

function onButtonClick(e) {
  e.preventDefault()

  if (shouldTunnel) {
    toggleTunnel()
    enableInputs()
  } else
    validateInputsThen(function() {
      toggleTunnel()
      disableInputs()
    })
}

function validateInputsThen(callback) {
  var port = portInput.value,
    username = usernameInput.value
  if (port.length < 2)
    appendLog('Port must contain 2 digits minimum and number only')
  else if (port[0] === '0') appendLog('Port cannot start with 0')
  else if (username.length <= 0) appendLog('Username length must be at least 1')
  else if (username.includes('/')) appendLog('Username cannot have /')
  else if (username.includes('.')) appendLog('Username cannot have .')
  else if (username.includes('"')) appendLog('Username cannot have "')
  else if (username.includes("'")) appendLog("Username cannot have '")
  else {
    validateUsername(username).then(function(isValidUsername) {
      if (isValidUsername) callback()
      else appendLog('Username exists or connection error')
    })
  }
}

function appendLog(log) {
  var newDomElement = document.createElement('h6')
  newDomElement.setAttribute('class', 'text-primary')
  newDomElement.innerHTML = log
  logWrapper.prepend(newDomElement)

  if (logWrapper.childElementCount > maxLogLength) logWrapper.lastChild.remove()
}

// main
window.addEventListener('load', function() {
  refreshTunnelStatus()
  tunnelToggleButton.addEventListener('click', onButtonClick)

  var isLocalhostRoot =
    location.hostname === 'localhost' && location.origin + '/' === location.href
  // if currently in localhost root, refresh page on file change
  if (isLocalhostRoot)
    io.connect('ws://' + serverURL + '/watch', { path: '/sock' }).on(
      'refresh',
      function() {
        location.reload()
      }
    )
})