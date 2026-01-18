class WebSocketManager {
    constructor() {
        this.socket = io();
        this.userId = null;
        this.bindEvents();
    }

    bindEvents() {
        this.socket.on('assign', (data) => {
            this.userId = data.userId;
            // Pass to canvas manager if needed
        });
        this.socket.on('draw', (data) => {
            if (data.type === 'start') {
                canvasManager.strokes[data.id] = { userId: data.userId, points: [{ x: data.x, y: data.y }], color: data.color, width: data.width };
            } else if (data.type === 'draw') {
                canvasManager.strokes[data.id].points.push({ x: data.x, y: data.y });
            }
            canvasManager.redraw();
        });
        this.socket.on('cursor', (data) => canvasManager.updateCursor(data.userId, data.x, data.y, data.color));
        this.socket.on('undo', (data) => canvasManager.removeStroke(data.id));
        this.socket.on('userUpdate', (users) => this.updateUsers(users));
    }

    send(data) {
        data.userId = this.userId;
        this.socket.emit('event', data);
    }

    updateUsers(users) {
        const usersDiv = document.getElementById('users');
        usersDiv.innerHTML = users.map(u => `<span style="color:${u.color}">${u.userId}</span>`).join(', ');
    }
}