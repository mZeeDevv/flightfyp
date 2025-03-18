import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000', // Allow connections from this origin
        methods: ['GET', 'POST'], // Allowed HTTP methods
    },
});

let adminSocket = null; // Track the admin's socket connection
let userChats = new Map(); // Store all user chats

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle admin connection
    socket.on('admin-connect', () => {
        adminSocket = socket; // Set the admin socket
        console.log('Admin connected:', socket.id);

        // Send existing chats to the admin
        adminSocket.emit('existing-chats', Array.from(userChats.values()));
    });

    // Handle user messages
    socket.on('user-message', (message) => {
        const userKey = `${message.username}-${message.email}`;
        console.log('Received user message:', message);
    
        if (!userChats.has(userKey)) {
            userChats.set(userKey, {
                username: message.username,
                email: message.email,
                messages: [],
            });
        }
    
        const chat = userChats.get(userKey);
        const messageObj = {
            text: message.text,
            username: message.username,
            from: 'user',
            timestamp: new Date().toISOString()
        };

        // Check for duplicate messages
        const isDuplicate = chat.messages.some(
            msg => msg.text === messageObj.text && 
                  msg.timestamp === messageObj.timestamp
        );

        if (!isDuplicate) {
            chat.messages.push(messageObj);
            // Emit the message to the admin only if it's not a duplicate
            if (adminSocket) {
                adminSocket.emit('user-message', {
                    userKey,
                    username: message.username,
                    email: message.email,
                    text: message.text,
                    timestamp: messageObj.timestamp,
                });
            }
        }
    });

    // Handle admin messages
    socket.on('admin-message', (message) => {
        const userKey = message.userKey; // Unique key for the user
        console.log('Received admin message:', message);

        // Add the admin's message to the user's chat
        if (userChats.has(userKey)) {
            const chat = userChats.get(userKey);
            chat.messages.push({
                text: message.text,
                username: 'Support',
                from: 'admin',
                timestamp: new Date(),
            });

            // Broadcast the admin's message to the user
            io.emit('admin-message', {
                userKey,
                text: message.text,
                username: 'Support',
            });
        }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Clear the admin socket if the admin disconnects
        if (socket === adminSocket) {
            adminSocket = null;
            console.log('Admin disconnected');
        }
    });
});

// Start the server
server.listen(4000, () => {
    console.log('Chat server running on port 4000');
});