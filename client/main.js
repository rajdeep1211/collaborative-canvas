const canvas = document.getElementById('canvas');
const socketManager = new WebSocketManager();
const canvasManager = new CanvasManager(canvas, socketManager);

// Toolbar events
document.getElementById('brush').addEventListener('click', () => canvasManager.updateTool('brush', document.getElementById('color').value, document.getElementById('width').value));
document.getElementById('eraser').addEventListener('click', () => canvasManager.updateTool('eraser', '#ffffff', document.getElementById('width').value));
document.getElementById('color').addEventListener('change', (e) => canvasManager.updateTool(canvasManager.tool, e.target.value, canvasManager.width));
document.getElementById('width').addEventListener('change', (e) => canvasManager.updateTool(canvasManager.tool, canvasManager.color, e.target.value));
document.getElementById('undo').addEventListener('click', () => socketManager.send({ type: 'undo' }));

// Cursor tracking
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    socketManager.send({ type: 'cursor', x: e.clientX - rect.left, y: e.clientY - rect.top });
});
