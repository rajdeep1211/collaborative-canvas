const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const socket = io();
const pingEl = document.getElementById("pingValue");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 60;
}
resize();
window.addEventListener("resize", resize);

const params = new URLSearchParams(window.location.search);
const ROOM_CODE = params.get("code");
document.getElementById("roomId").textContent = ROOM_CODE;

let USER_NAME = sessionStorage.getItem("username");

if (!USER_NAME) {
  USER_NAME = prompt("Enter your name");
  if (!USER_NAME) USER_NAME = "Guest";
  sessionStorage.setItem("username", USER_NAME);
}

socket.emit("joinRoom", { code: ROOM_CODE, name: USER_NAME });

let isDrawing = false;
let tool = "brush";
let color = "#000000";
let width = 3;
let lastX = 0;
let lastY = 0;
let currentStrokeId = null;

document.getElementById("brushBtn").onclick = () => tool = "brush";
document.getElementById("eraserBtn").onclick = () => tool = "eraser";
document.getElementById("colorPicker").oninput = e => color = e.target.value;
document.getElementById("strokeWidth").oninput = e => width = +e.target.value;

canvas.addEventListener("mousedown", e => {
  isDrawing = true;
  lastX = e.offsetX;
  lastY = e.offsetY;
  currentStrokeId = crypto.randomUUID();
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  currentStrokeId = null;
});

canvas.addEventListener("mouseout", () => {
  isDrawing = false;
  currentStrokeId = null;
});

canvas.addEventListener("mousemove", e => {
  if (!isDrawing) return;

  const x = e.offsetX;
  const y = e.offsetY;

  drawLine(lastX, lastY, x, y, tool, color, width);

  socket.emit("strokeDraw", {
    strokeId: currentStrokeId,
    x1: lastX,
    y1: lastY,
    x2: x,
    y2: y,
    tool,
    color,
    width
  });
  console.log("DRAW SENT:", currentStrokeId);

  socket.emit("cursor", {
    x: e.clientX,
    y: e.clientY
  });
  

  lastX = x;
  lastY = y;
});

function drawLine(x1, y1, x2, y2, tool, color, width) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineCap = "round";
  ctx.lineWidth = width;

  if (tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
  }

  ctx.stroke();
}

socket.on("strokeDraw", d => {
  drawLine(d.x1, d.y1, d.x2, d.y2, d.tool, d.color, d.width);
});

socket.on("redraw", strokes => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes.forEach(s => {
    drawLine(s.x1, s.y1, s.x2, s.y2, s.tool, s.color, s.width);
  });
});

document.getElementById("undoBtn").onclick = () => {
  socket.emit("undo");
};

socket.on("userUpdate", users => {
  const list = document.getElementById("usersList");
  document.getElementById("userCount").textContent = users.length;
  list.innerHTML = "";

  users.forEach(u => {
    const el = document.createElement("div");
    el.className = "user";
    el.innerHTML = `
      <div class="avatar" style="background:${u.color}">
        ${u.name[0]}
      </div>
      <div>${u.name}</div>
    `;
    list.appendChild(el);
  });
});
const cursors = {};

socket.on("cursor", data => {
  if (data.userId === socket.id) return;

  const { userId, name, color, x, y } = data;
  console.log("REMOTE CURSOR:", data);

  let cursor = cursors[userId];

  if (!cursor) {
    cursor = document.createElement("div");
    cursor.className = "remote-cursor";

    cursor.innerHTML = `
      <div class="cursor-dot"></div>
      <div class="cursor-label"></div>
    `;

    document.getElementById("remoteCursors").appendChild(cursor);
    cursors[userId] = cursor;
  }
  cursor.querySelector(".cursor-dot").style.background = color;
  cursor.querySelector(".cursor-label").textContent = name;

  cursor.style.transform = `translate(${x}px, ${y}px)`;
  cursor.style.opacity = "1";

  clearTimeout(cursor.hideTimer);
  cursor.hideTimer = setTimeout(() => {
    cursor.style.opacity = "0";
  }, 3000);
});

function updatePing(ms) {
    pingEl.textContent = `${ms} ms`;
    pingEl.className = "ping";
  
    if (ms < 100) pingEl.classList.add("good");
    else if (ms < 250) pingEl.classList.add("medium");
    else pingEl.classList.add("bad");
  }
  setInterval(() => {
    const start = Date.now();
  
    socket.emit("ping-check", () => {
      const latency = Date.now() - start;
      updatePing(latency);
    });
  }, 2000);
  