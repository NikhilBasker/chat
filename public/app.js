const socket = io("https://chat-tjqb.onrender.com");

const msgInput = document.querySelector("#message");
const nameInput = document.querySelector("#name");
const chatRoom = document.querySelector("#room");
const activity = document.querySelector(".activity");
const usersList = document.querySelector(".user-list");
const roomList = document.querySelector(".room-list");
const chatDisplay = document.querySelector(".chat-display");
const appDisplay = document.querySelector(".app");

function sendMessage(e) {
  e.preventDefault();
  if (nameInput.value && msgInput.value && chatRoom.value) {
    socket.emit("message", {
      name: nameInput.value,
      text: msgInput.value,
    });
    msgInput.value = "";
  }
  msgInput.focus();
}

function enterRoom(e) {
  e.preventDefault();
  if (nameInput.value && chatRoom.value) {
    socket.emit("enterRoom", {
      name: nameInput.value,
      room: chatRoom.value,
    });
  }
}

document.querySelector(".form-msg").addEventListener("submit", sendMessage);
document.querySelector(".form-join").addEventListener("submit", enterRoom);

msgInput.addEventListener("keypress", () => {
  socket.emit("activity", nameInput.value);
});

// Listen for messages
socket.on("message", (data) => {
  activity.textContent = "";
  const { name, text, time } = data;
  const li = document.createElement("li");
  li.className = "post";
  if (name === nameInput.value) li.className = "post post--left";
  if (name !== nameInput.value && name !== "Admin") li.className = "post post--right";
  li.innerHTML = `<div class="post__header">
        <span class="post__header--name">${name}</span> 
        <span class="post__header--time">${time}</span> 
        </div>
        <div class="post__text">${text}</div>`;
  chatDisplay.appendChild(li);
  appDisplay.scrollTop = appDisplay.scrollHeight;
});

// Typing indicator
let activityTimer;
socket.on("activity", (name) => {
  activity.textContent = `${name} is typing...`;
  clearTimeout(activityTimer);
  activityTimer = setTimeout(() => {
    activity.textContent = "";
  }, 3000);
});

// Update users and rooms
socket.on("userList", ({ users }) => showUsers(users));
socket.on("roomList", ({ rooms }) => showRooms(rooms));

function showUsers(users) {
  usersList.innerHTML = `<em>Users in ${chatRoom.value}:</em> ${users.map(user => user.name).join(", ")}`;
}

function showRooms(rooms) {
  roomList.innerHTML = `<em>Active Rooms:</em> ${rooms.join(", ")}`;
}
