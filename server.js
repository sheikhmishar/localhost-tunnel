const express = require('express')
const app = express()

const PORT = process.env.PORT || 5000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/', express.static('public'))

const clientSockets = []
const findClientSocketByUsername = username =>
	clientSockets.find(socket => socket.username === username)
const removeClientSocket = socket => {
	const clientSocketIndex = clientSockets.findIndex(soc => soc.id === socket.id)
	clientSockets.splice(clientSocketIndex, 1)
}

app.get('/:username/*', (req, res) => {
	const { url, method, headers, body } = req
	const { username } = req.params
	const clientRequest = {
		url: url.replace(`/${username}`, ''),
		method,
		headers,
		body
	}
	io.emit('request', clientRequest)

	const clientSocket = findClientSocketByUsername(username)
	const onClientResponse = clientResponse => {
		clientSocket.off('response', onClientResponse)
		if (clientResponse.headers['content-type'])
			res.contentType(clientResponse.headers['content-type'])
		res.send(clientResponse.data)
	}
	if (clientSocket) clientSocket.on('response', onClientResponse)
	else res.json({ message: 'Client not available' })
})

app.post('/validateusername', (req, res) => {
	if (req.body.username != 'invalid')
		res.status(200).json({ isValidUsername: true })
	else res.status(200).json({ isValidUsername: false })
})

const server = app.listen(PORT, () =>
	console.log(`Running server on port ${PORT}`)
)

const io = require('socket.io')(server)

io.on('connection', socket => {
	clientSockets.push(socket)
	socket.username = 'anonymous'
	socket.on('change_username', data => {
		socket.username = data.username
		console.log('User joined', socket.id, socket.username)
	})
	socket.on('disconnect', () => {
		console.log('User left', socket.id, socket.username)
		removeClientSocket(socket)
	})
})
