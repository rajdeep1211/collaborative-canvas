const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);


function generateUserColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 55%)`;
}

const rooms = new Map();

app.use(express.static(path.join(__dirname, "../client")));
app.use(express.json());



function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const part = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${part()}-${part()}`;
}

app.post("/api/rooms/create", (req, res) => {
  let code;
  do {
    code = generateRoomCode();
  } while (rooms.has(code));

  rooms.set(code, {
    users: new Map(),
    strokes: [],
    redoStack: new Map()
  });  
  res.json({ code });
});

app.get("/api/rooms/validate", (req, res) => {
  res.json({ exists: rooms.has(req.query.code) });
});

io.on("connection", (socket) => {
  let roomCode = null;
  const userId = socket.id;

  socket.on("joinRoom", ({ code, name }) => {
    if (!rooms.has(code)) {
      rooms.set(code, {
        users: new Map(),
        strokes: []
      });
    }
  
    roomCode = code;
    socket.join(code);
  
    const room = rooms.get(code);
  
    const user = {
      id: userId,
      name: name || "Guest",
      color: generateUserColor()
    };
  
    room.users.set(userId, user);
    room.redoStack.set(userId, []);

  
    socket.emit("redraw", room.strokes);
    io.to(code).emit("userUpdate", Array.from(room.users.values()));
  });
  

  socket.on("strokeDraw", (stroke) => {
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    room.strokes.push({ ...stroke, userId });
    room.redoStack.set(userId, []);
    socket.to(roomCode).emit("strokeDraw", stroke);
  });

  socket.on("undo", () => {
    if (!roomCode) return;
  
    const room = rooms.get(roomCode);
  
    let lastStrokeId = null;
  
    for (let i = room.strokes.length - 1; i >= 0; i--) {
      if (room.strokes[i].userId === userId) {
        lastStrokeId = room.strokes[i].strokeId;
        break;
      }
    }
  
    console.log("UNDO REQUEST → strokeId:", lastStrokeId);
  
    if (!lastStrokeId) return;
  
    room.strokes = room.strokes.filter(
      s => !(s.userId === userId && s.strokeId === lastStrokeId)
    );
  
    io.to(roomCode).emit("redraw", room.strokes);
  });
  

  socket.on("disconnect", () => {
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    room.users.delete(userId);
    io.to(roomCode).emit("userUpdate", Array.from(room.users.values()));

    if (room.users.size === 0) rooms.delete(roomCode);
  });
  socket.on("ping-check", (cb) => {
    if (cb) cb();
  });

  socket.on("cursor", ({ x, y }) => {
    if (!roomCode) return;
  
    const room = rooms.get(roomCode);
    if (!room) return;
  
    const user = room.users.get(socket.id);
    if (!user) return;
  
    socket.to(roomCode).emit("cursor", {
      userId: socket.id,
      name: user.name,
      color: user.color,
      x,
      y
    });
  });
  
  
  
  
});
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

