const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

/* =========================
   SOCKET.IO (Render-safe)
========================= */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"]
});

/* =========================
   HELPERS
========================= */
function generateUserColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 55%)`;
}

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const part = () =>
    Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  return `${part()}-${part()}`;
}

/* =========================
   IN-MEMORY STORE
========================= */
// roomCode -> { users: Map, strokes: [], redoStack: Map }
const rooms = new Map();

/* =========================
   EXPRESS MIDDLEWARE
========================= */
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/pages/join.html"));
});

app.get("/canvas", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/pages/canvas.html"));
});

// ✅ API
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


/* =========================
   SOCKET LOGIC
========================= */
io.on("connection", (socket) => {
  let roomCode = null;
  const userId = socket.id;

  /* JOIN ROOM */
  socket.on("joinRoom", ({ code, name }) => {
    // ❌ Do NOT auto-create room here
    if (!rooms.has(code)) {
      socket.emit("error", { message: "Room does not exist" });
      return;
    }
  
    roomCode = code;
    socket.join(code);
  
    const room = rooms.get(code);
  
    // ✅ SAFETY: ensure redoStack exists
    if (!room.redoStack) {
      room.redoStack = new Map();
    }
  
    const user = {
      id: socket.id,
      name: name || "Guest",
      color: generateUserColor()
    };
  
    room.users.set(socket.id, user);
    room.redoStack.set(socket.id, []);
  
    // Send existing strokes to new user
    socket.emit("redraw", room.strokes);
  
    // Update all users
    io.to(code).emit("userUpdate", Array.from(room.users.values()));
  });
  

  /* DRAW */
  socket.on("strokeDraw", (stroke) => {
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    // Ensure strokeId exists (CRITICAL for undo)
    if (!stroke.strokeId) {
      stroke.strokeId = `${Date.now()}-${Math.random()}`;
    }

    room.strokes.push({ ...stroke, userId });
    room.redoStack.set(userId, []);

    socket.to(roomCode).emit("strokeDraw", stroke);
  });

  /* UNDO (per-user, partial) */
  socket.on("undo", () => {
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    for (let i = room.strokes.length - 1; i >= 0; i--) {
      if (room.strokes[i].userId === userId) {
        room.strokes.splice(i, 1);
        break;
      }
    }

    io.to(roomCode).emit("redraw", room.strokes);
  });

  /* CURSOR */
  socket.on("cursor", ({ x, y }) => {
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const user = room.users.get(userId);
    if (!user) return;

    socket.to(roomCode).emit("cursor", {
      userId,
      name: user.name,
      color: user.color,
      x,
      y
    });
  });

  /* PING */
  socket.on("ping-check", (cb) => {
    if (typeof cb === "function") cb();
  });

  /* DISCONNECT */
  socket.on("disconnect", () => {
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    room.users.delete(userId);
    room.redoStack.delete(userId);

    io.to(roomCode).emit(
      "userUpdate",
      Array.from(room.users.values())
    );

    if (room.users.size === 0) {
      rooms.delete(roomCode);
    }
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
