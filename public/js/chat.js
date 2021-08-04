const socket = io();

//* Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $messages = document.querySelector("#messages");

const $sendLocationButton = document.querySelector("#send-location");

//* templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//* Options
const { username, room } = Qs.parse(location.search, {
	ignoreQueryPrefix: true,
}); //* question mark goes away

const autoScroll = () => {
	// new msg element
	const $newMessage = $messages.lastElementChild;

	//* height of new msg
	const newMessageStyles = getComputedStyle($newMessage);
	const newMessageMargin = parseInt(newMessageStyles.marginBottom);
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

	//* visible height
	const visibleHeight = $messages.offsetHeight;

	//* height of messages container
	const containerHeight = $messages.scrollHeight;

	//* how far have i scrolled
	const scrollOffset = $messages.scrollTop + visibleHeight;

	if (containerHeight - newMessageHeight <= scrollOffset) {
		$messages.scrollTop = $messages.scrollHeight; //* pushes us to bottom
	}
};

socket.on("message", (message) => {
	console.log(message);
	//* Mustache comes from cdn js link in index.html
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format("h:m a"), //* moment is provided in index.html
	});
	$messages.insertAdjacentHTML("beforeend", html);
	autoScroll();
});
socket.on("locationMessage", (url) => {
	console.log(url);
	const html = Mustache.render(locationTemplate, {
		username: url.username,
		url: url.text,
		createdAt: moment(url.createdAt).format("h:m a"),
	});
	$messages.insertAdjacentHTML("beforeend", html);
});
socket.on("roomData", ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, { room, users });
	document.querySelector("#sidebar").innerHTML = html;
	autoScroll();
});

$messageForm.addEventListener("submit", (e) => {
	e.preventDefault();
	//* disabling submit button
	$messageFormButton.setAttribute("disabled", "disabled");
	message = e.target.elements.message.value;

	socket.emit("sendMessage", message, (error) => {
		//* enabling button
		$messageFormButton.removeAttribute("disabled");
		$messageFormInput.value = ""; //* clearing text
		$messageFormInput.focus();

		if (error) return console.log(error); //* acknowledge the event
		console.log("Message delivered!");
	});
});

$sendLocationButton.addEventListener("click", function () {
	if (!navigator.geolocation)
		return alert("Geolocation is not supported by your browser");

	//* disabling button
	$sendLocationButton.setAttribute("disabled", "disabled");

	//* synchronous
	navigator.geolocation.getCurrentPosition((position) => {
		socket.emit(
			"sendLocation",
			{
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
			},
			() => {
				//* enabling button
				$sendLocationButton.removeAttribute("disabled");
				console.log("location shared");
			}
		);
	});
});

socket.emit("join", { username, room }, (error) => {
	if (error) {
		alert(error);
		location.href = "/";
	}
});
