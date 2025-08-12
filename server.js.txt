const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Allowed codes
const validCodes = ["3745", "6957", "7869", "6292", "7545"];

// Store messages per code
let roomsData = {};

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Socket.IO logic
io.on("connection", (socket) => {
    let currentRoom = null;
    let userName = null;

    socket.on("joinRoom", ({ name, code }) => {
        if (!validCodes.includes(code)) {
            socket.emit("invalidCode");
            return;
        }

        currentRoom = code;
        userName = name;

        socket.join(currentRoom);

        if (!roomsData[currentRoom]) {
            roomsData[currentRoom] = {
                messages: [],
                lastMessage: null,
                users: new Set()
            };
        }

        roomsData[currentRoom].users.add(socket.id);

        // Send existing messages
        socket.emit("chatHistory", roomsData[currentRoom].messages);

        // If no messages but lastMessage exists, send it
        if (roomsData[currentRoom].messages.length === 0 && roomsData[currentRoom].lastMessage) {
            socket.emit("chatHistory", [roomsData[currentRoom].lastMessage]);
        }
    });

    socket.on("chatMessage", (msg) => {
        if (!currentRoom) return;

        const messageObj = {
            user: userName,
            text: msg,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        roomsData[currentRoom].messages.push(messageObj);

        io.to(currentRoom).emit("message", messageObj);
    });

    socket.on("disconnect", () => {
        if (!currentRoom) return;

        const roomInfo = roomsData[currentRoom];
        if (!roomInfo) return;

        roomInfo.users.delete(socket.id);

        if (roomInfo.users.size === 0) {
            // Store last message and clear all others
            if (roomInfo.messages.length > 0) {
                roomInfo.lastMessage = roomInfo.messages[roomInfo.messages.length - 1];
            }
            roomInfo.messages = [];
        }
    });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
