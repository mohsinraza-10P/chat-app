const path = require("path"); // Core module (built-in)
const http = require("http"); // Core module (built-in)
const express = require("express"); // npm module
const socketio = require("socket.io"); // npm module
const Filter = require("bad-words"); // npm module
const { generateMessage } = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

// Create the Express application
const app = express();

// Create the HTTP server explicitly using the Express app
const server = http.createServer(app);

// Connect socket.io to the HTTP server
const io = socketio(server);

// Define configs for Express application
const port = process.env.PORT || 3000;
const publicDirPath = path.join(__dirname, "../public");

// Setup static directory to serve
app.use(express.static(publicDirPath));

// Listen for new connections to Socket.io (built-in event)
io.on("connection", (socket) => {
  console.log("New socket connected:", socket.id);

  socket.on("join-room", function ({ username, room }, callback) {
    const { user, error } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    // Emits a welcome message to the newly connected client only
    socket.emit(
      "message",
      generateMessage("Admin", "Welcome to the application!")
    );

    // Emits a message to all the clients in current room except for the newly connected client
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("Admin", `${user.username} has joined!`)
      );

    // Emits room info to all clients in current room as soon as someone joins
    io.to(user.room).emit("room-info", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
  });

  socket.on("send-message", function (message, callback) {
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback({
        error: "Profanity is not allowed.",
      });
    }

    const user = getUser(socket.id);
    if (user) {
      // Emits a message to all clients in current room
      message = generateMessage(user.username, message);
      io.to(user.room).emit("message", message);
      // Trigger callback for acknowledgement
      callback(message);
    }
  });

  socket.on("send-location", function (coordinates, callback) {
    const user = getUser(socket.id);
    if (user) {
      // Emits a location message to all clients in current room
      const message = generateMessage(
        user.username,
        `https://google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`
      );
      io.to(user.room).emit("location-message", message);
      callback(message);
    }
  });

  // Listen for disconnectivity for an existing client (built-in event)
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    const user = removeUser(socket.id);
    // If user was in the room and removed successfully
    if (user) {
      // Emits a message to all clients in current room
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left!`)
      );

      // Emits room info to all clients in current room as soon as someone leaves
      io.to(user.room).emit("room-info", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

// Listen to the web server
server.listen(port, () => {
  console.log("Server is up on port:", port);
});
