const path = require("path");
const http = require("http"); //* for web sockets
const express = require("express");
const socket_io = require("socket.io");
const Filter = require("bad-words"); //* bad words library
const { generateMessage } = require("./utils/messages");
const {
	addUser,
	removeUser,
	getUser,
	getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app); //* if not done, express does it automatically
const io = socket_io(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));

//* connection is built in name
io.on("connection", (socket) => {
	console.log("New connection made");

	socket.on("join", (options, callback) => {
		const { error, user } = addUser({ id: socket.id, ...options });
		if (error) return callback(error);

		socket.join(user.room);
		socket.emit("message", generateMessage("Welcome!"));
		socket.broadcast
			.to(user.room)
			.emit("message", generateMessage(`${user.username} has joined!`)); //* sends to everybody except the user
		io.to(user.room).emit("roomData", {
			room: user.room,
			users: getUsersInRoom(user.room),
		});
		//* io.to.emit, socket.broadcast.to.emit <==== working with room
		callback();
	});

	socket.on("sendLocation", (location, callback) => {
		const user = getUser(socket.id);
		io.to(user.room).emit(
			"locationMessage",
			generateMessage(
				`https://google.com/maps?q=${location.latitude},${location.longitude}`,
				user.username
			)
		);
		callback();
	});

	socket.on("sendMessage", (message, callback) => {
		//* bad words npm package
		const filter = new Filter();
		if (filter.isProfane(message)) return callback("Profanity is not allowed");

		const user = getUser(socket.id);
		io.to(user.room).emit("message", generateMessage(message, user.username));
		callback();
	});

	//* when a user disconnects
	socket.on("disconnect", () => {
		const user = removeUser(socket.id);
		if (user) {
			io.to(user.room).emit(
				"message",
				generateMessage(`${user.username} has left`)
			);
			io.to(user.room).emit("roomData", {
				room: user.room,
				users: getUsersInRoom(user.room),
			});
		}
	});
});

server.listen(port, () => console.log(`Running on port ${port}`));
