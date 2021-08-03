const path = require("path");
const http = require("http"); //* for web sockets
const express = require("express");
const socket_io = require("socket.io");
const Filter = require("bad-words"); //* bad words library
const { generateMessage } = require("./utils/messages");

const app = express();
const server = http.createServer(app); //* if not done, express does it automatically
const io = socket_io(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));

//* connection is built in name
io.on("connection", (socket) => {
	console.log("New connection made");

	socket.on("join", ({ username, room }) => {
		socket.join(room);
		socket.emit("message", generateMessage("Welcome!"));
		socket.broadcast
			.to(room)
			.emit("message", generateMessage(`${username} has joined!`)); //* sends to everybody except the user
		//* io.to.emit, socket.broadcast.to.emit <==== working with room
	});

	socket.on("sendLocation", (location, callback) => {
		io.emit(
			"locationMessage",
			generateMessage(
				`https://google.com/maps?q=${location.latitude},${location.longitude}`
			)
		);
		callback();
	});

	socket.on("sendMessage", (message, callback) => {
		//* bad words npm package
		const filter = new Filter();
		if (filter.isProfane(message)) return callback("Profanity is not allowed");

		io.emit("message", generateMessage(message));
		callback();
	});

	//* when a user disconnects
	socket.on("disconnect", () => {
		io.emit("message", generateMessage("A user has left"));
	});
});

server.listen(port, () => console.log(`Running on port ${port}`));
