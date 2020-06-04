// html elements
var usernameInput = document.querySelector('#username-input'),
	portInput = document.querySelector('#port-input'),
	tunnelToggleButton = document.querySelector('#tunnel-toggle-button'),
	logWrapper = document.querySelector('.log-wrapper')

// status variables
var isTunneling = false,
	maxLogLength = 20

// server variables
var serverURL = 'localhost-tunnel.herokuapp.com' // will be replaced by deployed server url
// var serverURL = 'localhost:5000' // will be replaced by deployed server url
var socket

// helper functions
function intitiateSocket() {
	socket = io.connect('ws://' + serverURL)
	socket.on('connect', function() {
		socket.emit('change_username', { username: usernameInput.value })
	})
	socket.on('request', tunnelLocalhostToServer)
}

function tunnelLocalhostToServer(serverRequest) {
	makeRequestToLocalhost(serverRequest).then(sendResponsoToServer)
}

function makeRequestToLocalhost(req) {
	var { method, url: path, headers, data } = req
	var url = 'http://localhost:' + portInput.value + path
	var requestParameters = {
		// headers,
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
		)
		tunnelToggleButton.innerText = 'Stop tunneling'
	} else {
		appendLog('Tunnel is stopped')
		tunnelToggleButton.innerText = 'Start tunneling'
	}
}
refreshTunnelStatus()

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
	if (portInput.value.length < 2) appendLog('Port length must be at least 2')
	else if (portInput.value[0] === '0') appendLog('Port cannot start with 0')
	else if (usernameInput.value.length <= 0) {
		appendLog('Username length must be at least 1')
	} else {
		validateUsername().then(isValidUsername => {
			if (!isValidUsername) {
				appendLog('Username exists or connection error')
			} else toggleTunnel()
		})
	}
}

function validateUsername() {
	return axios
		.post('http://' + serverURL + '/validateusername', {
			username: usernameInput.value
		})
		.then(res => res.data.isValidUsername)
		.catch(err => false)
}

function appendLog(log) {
	var newDomElement = document.createElement('h6')
	newDomElement.setAttribute('class', 'text-primary')
	newDomElement.innerText = log
	logWrapper.appendChild(newDomElement)

	if (logWrapper.childElementCount > maxLogLength)
		logWrapper.firstChild.remove()
}

tunnelToggleButton.onclick = validate
