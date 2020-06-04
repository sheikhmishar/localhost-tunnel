const express = require('express')
const app = express()

const PORT = process.env.PORT || 5000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/', express.static('public'))

let clientSocket

app.get('/:user/*', (req, res) => {
	const { url, method, headers, body } = req
	const clientRequest = {
		url: url.replace(`/${req.params.user}`, ''),
		method,
		headers,
		body
	}
	io.emit('request', clientRequest)

	const onClientResponse = clientResponse => {
		clientSocket.off('response', onClientResponse)

		if (clientResponse.headers['content-type'])
			res.contentType(clientResponse.headers['content-type'])
		res.send(clientResponse.data)
	}
	if (clientSocket) clientSocket.on('response', onClientResponse)
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
	console.log('New client joined', socket.id)
	clientSocket = socket
	socket.on('disconnect', () => console.log('disconnected', socket.id))
})
