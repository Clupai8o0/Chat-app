const users = [];

// todo addUser, removeUser, getUser, getUsersInRoom
const addUser = ({ id, username, room }) => {
	// Clean the data
	username = username.trim().toLowerCase(); //* removing spaces
	room = room.trim().toLowerCase();

	// Validate the data
	if (!username || !room)
		return {
			error: "Username and room are required",
		};

	// check for existing user
	const existingUser = users.find((user) => {
		return user.room === room && user.username === username;
	});
	if (existingUser) return { error: "Username has already been taken" };

	// store user
	user = {
		id,
		username,
		room,
	};
	users.push(user);
	return { user };
};

const removeUser = (id) => {
	const index = users.findIndex((user) => user.id === id);

	if (index !== -1) users.splice(index, 1)[0];
};
