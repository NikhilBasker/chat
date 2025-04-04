import express from "express";
import { Server } from "socket.io";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

// Setup __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3500;
const ADMIN = "Admin";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow frontend requests
    methods: ["GET", "POST"],
  },
});

// Serve static files (Frontend)
app.use(express.static(path.join(__dirname, "public")));

const UsersState = {
  users: [],
  setUsers: function (newUsersArray) {
    this.users = newUsersArray;
  },
};

// Socket.io Logic
io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);
  socket.emit("message", buildMsg(ADMIN, "Welcome to Chat App!"));

  socket.on("enterRoom", ({ name, room }) => {
    const prevRoom = getUser(socket.id)?.room;
    if (prevRoom) {
      socket.leave(prevRoom);
      io.to(prevRoom).emit("message", buildMsg(ADMIN, `${name} left the room`));
    }

    const user = activateUser(socket.id, name, room);

    if (prevRoom) {
      io.to(prevRoom).emit("userList", { users: getUsersInRoom(prevRoom) });
    }

    socket.join(user.room);
    socket.emit("message", buildMsg(ADMIN, `You joined ${user.room} chat room`));
    socket.broadcast.to(user.room).emit("message", buildMsg(ADMIN, `${user.name} joined`));

    io.to(user.room).emit("userList", { users: getUsersInRoom(user.room) });
    io.emit("roomList", { rooms: getAllActiveRooms() });
  });

  socket.on("disconnect", () => {
    const user = getUser(socket.id);
    userLeavesApp(socket.id);

    if (user) {
      io.to(user.room).emit("message", buildMsg(ADMIN, `${user.name} left the room`));
      io.to(user.room).emit("userList", { users: getUsersInRoom(user.room) });
      io.emit("roomList", { rooms: getAllActiveRooms() });
    }

    console.log(`User ${socket.id} disconnected`);
  });

  socket.on("message", ({ name, text }) => {
    const room = getUser(socket.id)?.room;
    if (room) {
      io.to(room).emit("message", buildMsg(name, text));
    }
  });

  socket.on("activity", (name) => {
    const room = getUser(socket.id)?.room;
    if (room) {
      socket.broadcast.to(room).emit("activity", name);
    }
  });
});

// Helper functions
function buildMsg(name, text) {
  return { name, text, time: new Date().toLocaleTimeString() };
}

function activateUser(id, name, room) {
  const user = { id, name, room };
  UsersState.setUsers([...UsersState.users.filter((user) => user.id !== id), user]);
  return user;
}

function userLeavesApp(id) {
  UsersState.setUsers(UsersState.users.filter((user) => user.id !== id));
}

function getUser(id) {
  return UsersState.users.find((user) => user.id === id);
}

function getUsersInRoom(room) {
  return UsersState.users.filter((user) => user.room === room);
}

function getAllActiveRooms() {
  return [...new Set(UsersState.users.map((user) => user.room))];
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
