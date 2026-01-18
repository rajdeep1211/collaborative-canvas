const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const DrawingState = require('./drawing-state');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const state = new DrawingState();

app.use(express.static('client'));  // Serve frontend files

io.on('connection', (socket) => {
    const userId = socket.id;
    const color = state.assignUser(userId);
    socket.emit('assign', { userId, color });  // Assign user ID and color
    io.emit('userUpdate', state.getUsers());  // Broadcast online users

    socket.on('event', (data) => {
        data.userId = userId;  // Attach user ID
        if (data.type === 'start' || data.type === 'draw' || data.type === 'end') {
            socket.broadcast.emit('draw', data);  // Broadcast drawing to others
        } else if (data.type === 'cursor') {
            socket.broadcast.emit('cursor', { ...data, color });  // Broadcast cursor
        } else if (data.type === 'undo') {
            const strokeId = state.getLastStroke(userId);
            if (strokeId) {
                io.emit('undo', { id: strokeId });  // Broadcast undo to all
                state.removeStroke(userId);
            }
        }
    });

    socket.on('disconnect', () => {
        state.removeUser(userId);
        io.emit('userUpdate', state.getUsers());  // Update user list
    });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));