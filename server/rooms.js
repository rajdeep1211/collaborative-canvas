class RoomManager {
    constructor() {
        this.room = 'global';  // Single room for simplicity
    }

    getRoom() {
        return this.room;
    }
}

module.exports = RoomManager;