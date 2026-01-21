const DrawingState = require("./drawing-state");

class RoomManager {
  constructor() {
    // Map<roomCode, DrawingState>
    this.rooms = new Map();
  }

 

  generateRoomCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    const part = () =>
      Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");

    return `${part()}-${part()}`;
  }



  createRoom() {
    let code;

    do {
      code = this.generateRoomCode();
    } while (this.rooms.has(code));

    this.rooms.set(code, new DrawingState());
    return code;
  }

  roomExists(code) {
    return this.rooms.has(code);
  }

  getRoomState(code) {
    return this.rooms.get(code);
  }

  joinRoom(code, userId) {
    if (!this.rooms.has(code)) return null;
    return this.rooms.get(code);
  }

  leaveRoom(code, userId) {
    const state = this.rooms.get(code);
    if (!state) return;

    state.removeUser(userId);

    // delete room if empty
    if (state.getUsers().length === 0) {
      this.rooms.delete(code);
    }
  }
}

module.exports = RoomManager;
