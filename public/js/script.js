// HTML elements
var usernameInput = document.querySelector('#username-input'),
  portInput = document.querySelector('#port-input'),
  tunnelToggleButton = document.querySelector('#tunnel-toggle-button'),
  logWrapper = document.querySelector('.log-wrapper')

// State variables
var isTunneling = false,
  maxLogLength = 20

// Server variables
var serverURL = location.host // TODO: Will be replaced by deployed server url
var socket

// Helper functions
function intitiateSocket() {
  socket = io.connect('ws://' + serverURL)
  socket.on('connect', function() {
    socket.emit('username', { username: usernameInput.value })
  })
  socket.on('request', tunnelLocalhostToServer)
}

function validateUsername(username) {
  return axios
    .post('http://' + serverURL + '/validateusername', {
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
  makeRequestToLocalhost(serverRequest).then(sendResponsoToServer)
}

function makeRequestToLocalhost(req) {
  var { method, url: path, headers, data } = req
  var url = 'http://localhost:' + portInput.value + path
  var requestParameters = {
    // headers, // TODO: fix errors
    withCredentials: true,
    method,
    url,
    data
  }
  return axios(requestParameters)
}

function sendResponsoToServer(localhostResponse) {
  socket.emit('response', localhostResponse)
}

// UI helper functions
function refreshTunnelStatus() {
  if (isTunneling) {
    appendLog('Tunnel is running at port ' + portInput.value)
    appendLog(
      'Your localhost is now avaiable at ' +
        'http://' +
        serverURL +
        '/' +
        usernameInput.value +
        '/'
    ) // TODO: Add clickable link
    tunnelToggleButton.innerText = 'Stop tunneling'
  } else {
    appendLog('Tunnel is stopped')
    tunnelToggleButton.innerText = 'Start tunneling'
  }
}

function toggleTunnel() {
  isTunneling = !isTunneling

  if (isTunneling) intitiateSocket()
  else socket.disconnect()

  refreshTunnelStatus()
}

function validate() {
  if (!isTunneling) validateInputs()
  else toggleTunnel()
}

function validateInputs() {
  var port = portInput.value,
    username = usernameInput.value
  if (port.length < 2) appendLog('Port length must be at least 2')
  else if (port[0] === '0') appendLog('Port cannot start with 0')
  else if (username.length <= 0) appendLog('Username length must be at least 1')
  else if (username.includes('/')) appendLog('Username cannot have /')
  else {
    validateUsername(username).then(function(isValidUsername) {
      if (!isValidUsername) appendLog('Username exists or connection error')
      else toggleTunnel()
    })
  }
}

function appendLog(log) {
  var newDomElement = document.createElement('h6')
  newDomElement.setAttribute('class', 'text-primary')
  newDomElement.innerText = log
  logWrapper.prepend(newDomElement)

  if (logWrapper.childElementCount > maxLogLength)
    logWrapper.lastChild.remove()
}

// main
refreshTunnelStatus()
tunnelToggleButton.onclick = validate
