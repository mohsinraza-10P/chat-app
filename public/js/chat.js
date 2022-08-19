const socket = io();

// server (emit) -> client (receive) --acknowledgement --> server
// client (emit) -> server (receive) --acknowledgement --> client

// Elements
const formMessage = document.getElementById("message-form");
const txtMessage = formMessage.querySelector("input");
const btnMessage = formMessage.querySelector("button");
const btnLocation = document.getElementById("send-location");
const messageContainer = document.getElementById("message-container");
const sidebarContainer = document.getElementById("sidebar-container");

// Templates
const messageTemplate = document.getElementById("message-template").innerHTML;
const locationTemplate = document.getElementById("location-template").innerHTML;
const siderbarTemplate = document.getElementById("sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  messageContainer.scrollTop = messageContainer.scrollHeight;
};

socket.on("message", (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messageContainer.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("location-message", (message) => {
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messageContainer.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("room-info", ({ room, users }) => {
  const html = Mustache.render(siderbarTemplate, {
    room,
    users,
  });
  sidebarContainer.innerHTML = html;
});

formMessage.addEventListener("submit", (e) => {
  e.preventDefault();

  const msg = txtMessage.value;
  if (!msg) {
    return alert("Please enter your message.");
  }

  btnMessage.setAttribute("disabled", "disabled");

  // Emitting event with acknowledgement
  const event = "send-message";
  socket.emit(event, msg, function (response) {
    btnMessage.removeAttribute("disabled");
    txtMessage.value = "";
    txtMessage.focus();

    if (response.error) {
      console.warn("Failed:", response);
    } else {
      console.log("Delivered:", response);
    }
  });
});

btnLocation.addEventListener("click", (e) => {
  if (!navigator.geolocation) {
    return alert("This browser does not support geo-location.");
  }

  btnLocation.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    const coordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    socket.emit("send-location", coordinates, function (message) {
      btnLocation.removeAttribute("disabled");
      console.log("Location shared:", message);
    });
  });
});

socket.emit("join-room", { username, room }, function (error) {
  alert(error);
  location.href = "/";
});
