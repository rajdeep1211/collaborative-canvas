class DrawingState {
    constructor() {
        this.users = {};  // Tracks users: {userId: {color, lastStrokeId}}
        this.colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
        this.colorIndex = 0;
    }

    assignUser(userId) {
        const color = this.colors[this.colorIndex % this.colors.length];
        this.users[userId] = { color, lastStrokeId: null };
        this.colorIndex++;
        return color;
    }

    removeUser(userId) {
        delete this.users[userId];
    }

    getUsers() {
        return Object.keys(this.users).map(id => ({ userId: id, color: this.users[id].color }));
    }

    setLastStroke(userId, strokeId) {
        if (this.users[userId]) this.users[userId].lastStrokeId = strokeId;
    }

    getLastStroke(userId) {
        return this.users[userId]?.lastStrokeId;
    }

    removeStroke(userId) {
        this.users[userId].lastStrokeId = null;
    }
}

module.exports = DrawingState;