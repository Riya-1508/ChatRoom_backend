const path = require("path");
const http = require("http");
const express = require("express");
const app = express();
const socketio = require("socket.io");
const server = http.createServer(app);
const io = socketio(server);
const formatmessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");
//Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "Chatcord Bot";

//Run when a client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    //Welcome current user
    socket.emit("message", formatmessage(botName, "Welcome to ChatCord"));
    //broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatmessage(botName, `${user.username} has joined the chat`)
      );

    //Send users and room info
    io.to(user.room).emit('roomUsers',{
        room: user.room,
        users: getRoomUsers(user.room)
    });
  });

  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatmessage(user.username, msg));
  });

  //Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatmessage(botName, `${user.username} has left the chat`)
      );
      //Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
