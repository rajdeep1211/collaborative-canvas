# DrawTogether – System Architecture
This document explains the internal architecture, data flow, and design decisions of the **DrawTogether** real-time collaborative drawing application.
The system is designed to support multiple users drawing simultaneously on a shared canvas with low latency and consistent synchronization.
## High-Level Architecture
DrawTogether follows a **client–server architecture** using **WebSockets** for real-time communication.
+--------------------+
| Client Browser |
| (Canvas + UI + JS) |
+---------▲----------+
│ WebSocket (Socket.IO)
▼
+--------------------+
| Node.js Server |
| (Rooms, Users, |
| Drawing State) |
+--------------------+
- The **server** is the single source of truth.
- The **client** is responsible for rendering UI and canvas updates.
- Each room operates independently.
#Room-Based Design
Each room maintains its own state:



```js
Room {
  users: Map<userId, User>,
  strokes: Stroke[],
  redoStack: Map<userId, Stroke[]>
}
This ensures:
•	Isolation between rooms
•	Independent undo/redo history
•	Scalable collaboration
Data Flow Diagram (Textual)
Drawing Event Flow
1.	User draws on the canvas.
2.	Canvas generates drawing segments.
3.	Client emits strokeDraw via WebSocket.
4.	Server stores the stroke.
5.	Server broadcasts the stroke to other users.
6.	Clients render the stroke locally.
User Input
   ↓
Canvas API
   ↓
socket.emit("strokeDraw")
   ↓
Server stores stroke
   ↓
socket.broadcast
   ↓
Other clients render stroke
 WebSocket Communication Protocol
Client → Server Events
Event Name	Description	
    
1.	joinRoom	Join a drawing room using a room code
2.	strokeDraw	Send a drawing stroke segment
3.	cursor	Send cursor position updates
4.	undo	Undo last stroke (per user)
5.	redo	Redo last undone stroke
6.	activity	Update user state (drawing / idle)

Server → Client Events	
Event Name	Description
assign	Sends assigned user data (name, color)
userUpdate	Broadcasts online users list
strokeDraw	Broadcasts drawing segments
redraw	Sends full canvas redraw
cursor	Broadcasts remote cursor movement

Undo / Redo Strategy
Problem Statement
A single stroke consists of multiple small line segments generated during mouse movement. Undoing only one segment would result in partial deletion.
Solution
•	Each stroke is assigned a unique strokeId
•	All segments belonging to the same stroke share this strokeId
•	Undo removes all segments with the most recent strokeId for that user
•	Redo restores the removed segments
•	Data Structures Used


Code:-
strokes: [
  { strokeId, userId, x1, y1, x2, y2, color, width }
]
redoStack: Map<userId, Stroke[]>
Undo / Redo Behavior
•	Undo and redo are per user
•	Users cannot undo or redo other users’ strokes
•	Redo stack clears when a new stroke is drawn
•	All undo/redo actions are synchronized across clients
User Management Architecture
Each user is represented as:
Code:-
User {
  id,
  name,
  color,
  state // "drawing" | "idle"
}
User Lifecycle
•	User joins room
•	Server assigns a unique color
•	User added to room’s user list
•	User activity state updates in real time
•	On disconnect, user is removed
The server broadcasts updated user lists to all clients.

Cursor Synchronization
•	Clients send cursor positions continuously
•	Server forwards cursor updates to other users
•	Clients interpolate cursor movement for smooth animation
•	Cursor is displayed as:
o	Colored circle
o	User name below the cursor
Performance Decisions
Key Optimizations
•	WebSockets instead of HTTP polling for low latency
•	Room-based broadcasting to limit network traffic
•	Cursor interpolation using linear interpolation (LERP)
•	Full canvas redraw for undo/redo (simpler and consistent)
Why These Choices?
•	Reduces complexity
•	Improves maintainability
•	Ensures consistent canvas state across users
•	Avoids race conditions in partial redraws
 Conflict Resolution Strategy
Problem
Multiple users may draw simultaneously or overlap strokes.
Strategy
•	No locking or blocking mechanism
•	Each stroke is independent
•	Server orders strokes by arrival time
•	Canvas naturally merges overlapping drawings
This allows smooth collaboration without interrupting users.
 Design Philosophy
•	Server is the authoritative source of state
•	Clients are lightweight renderers
•	Favor simplicity over premature optimization
•	Real-time feedback is prioritized over strict ordering
•	Collaboration should feel natural and uninterrupted
 Future Improvements
•	Persistent storage (database or Redis)
•	User authentication
•	Canvas export (PNG / SVG)
•	Mobile and touch support

Summary
Draw Together demonstrates a clean and scalable real-time collaborative system using WebSockets.
The architecture supports multiple users, real-time synchronization, per-user undo/redo, and live presence tracking while maintaining simplicity and reliability.
