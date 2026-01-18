class CanvasManager {
    constructor(canvas, socket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.socket = socket;
        this.strokes = {};  // Store strokes: {id: {userId, points, color, width}}
        this.cursors = {};  // Store cursors: {userId: {x, y, color}}
        this.isDrawing = false;
        this.currentStrokeId = null;
        this.tool = 'brush';
        this.color = '#000000';
        this.width = 5;
        this.bindEvents();
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.endDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.endDrawing.bind(this));
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.currentStrokeId = Date.now() + Math.random();
        const { x, y } = this.getMousePos(e);
        this.strokes[this.currentStrokeId] = {
            userId: this.socket.userId,
            points: [{ x, y }],
            color: this.tool === 'eraser' ? '#ffffff' : this.color,
            width: this.width
        };
        this.socket.send({ type: 'start', id: this.currentStrokeId, x, y, color: this.strokes[this.currentStrokeId].color, width: this.width });
        this.redraw();
    }

    draw(e) {
        if (!this.isDrawing) return;
        const { x, y } = this.getMousePos(e);
        this.strokes[this.currentStrokeId].points.push({ x, y });
        this.socket.send({ type: 'draw', id: this.currentStrokeId, x, y });
        this.redraw();
    }

    endDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.socket.send({ type: 'end', id: this.currentStrokeId });
        this.currentStrokeId = null;
    }

    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        Object.values(this.strokes).forEach(stroke => this.drawStroke(stroke));
        Object.values(this.cursors).forEach(cursor => this.drawCursor(cursor));
    }

    drawStroke(stroke) {
        if (stroke.points.length < 2) return;
        this.ctx.strokeStyle = stroke.color;
        this.ctx.lineWidth = stroke.width;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.forEach(point => this.ctx.lineTo(point.x, point.y));
        this.ctx.stroke();
    }

    drawCursor(cursor) {
        this.ctx.fillStyle = cursor.color;
        this.ctx.beginPath();
        this.ctx.arc(cursor.x, cursor.y, 5, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    updateCursor(userId, x, y, color) {
        this.cursors[userId] = { x, y, color };
        this.redraw();
    }

    removeStroke(id) {
        delete this.strokes[id];
        this.redraw();
    }

    updateTool(tool, color, width) {
        this.tool = tool;
        this.color = color;
        this.width = width;
    }
}