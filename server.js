const express = require("express");
const App = express();

const PORT = process.env.PORT || 5000;

App.use(express.json());
App.use(express.urlencoded({ extended: true }));

App.use("/", express.static("public"));

let clientSocket;

App.get("/get/*", (req, res) => {
	const { url, method, headers } = req;
	const reqHeaders = {
		url: url.replace("/get", ""),
		method,
		headers
	};
	console.log(reqHeaders);
	io.emit("request", reqHeaders);
	clientSocket.on("reply", data => {
		console.log(data);
		res.send(data);
	});
});

const server = App.listen(PORT, () =>
	console.log(`Running server on port ${PORT}`)
);

const io = require("socket.io")(server);

io.on("connection", socket => {
	console.log("New client joined", socket.id);
	clientSocket = socket;
});
