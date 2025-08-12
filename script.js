const socket = io();

const login = document.getElementById("login");
const chat = document.getElementById("chat");
const enterBtn = document.getElementById("enterBtn");
const errorMsg = document.getElementById("error");
const messagesDiv = document.getElementById("messages");
const sendBtn = document.getElementById("send");
const msgInput = document.getElementById("msg");

let userName, teamCode;

enterBtn.addEventListener("click", () => {
    userName = document.getElementById("name").value.trim();
    teamCode = document.getElementById("code").value.trim();

    socket.emit("joinRoom", { name: userName, code: teamCode });
});

socket.on("invalidCode", () => {
    errorMsg.classList.remove("hidden");
});

socket.on("chatHistory", (msgs) => {
    login.classList.add("hidden");
    chat.classList.remove("hidden");
    messagesDiv.innerHTML = "";
    msgs.forEach(addMessage);
});

sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

function sendMessage() {
    const msg = msgInput.value.trim();
    if (!msg) return;
    socket.emit("chatMessage", msg);
    msgInput.value = "";
}

socket.on("message", (message) => {
    addMessage(message);
});

function addMessage({ user, text, time }) {
    const div = document.createElement("div");
    div.classList.add("mb-2");
    div.innerHTML = `<strong>${user}</strong> <span class="text-gray-500 text-sm">${time}</span><br>${text}`;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
