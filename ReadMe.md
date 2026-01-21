DrawTogether – Real-Time Collaborative Drawing Canvas

DrawTogether is a real-time, multi-user collaborative drawing application that allows multiple users to draw simultaneously on a shared canvas.
It is built using HTML5 Canvas, Node.js, Express, and Socket.IO, focusing on low-latency synchronization and simple user interaction.

Project Objectives
•	Enable multiple users to draw on the same canvas in real time
•	Synchronize drawing strokes and cursor positions instantl
•	Manage users with unique colors and live online status
•	Support per-user undo and redo operations
•	Demonstrate real-time web application concepts using WebSockets

Features
•	Real-Time Drawing – All users see strokes instantly as they are drawn
•	Room-Based Collaboration – Users join using a shared room code
•	Live Cursor Tracking – See other users’ cursors with names and colors
•	User Management – Displays online users with drawing/idle status
•	Unique User Colors – Each user is assigned a distinct color
•	Undo / Redo (Per User) – Users can undo and redo their own strokes
•	No Authentication Required – Join instantly without signup


Technology Stack
Frontend
•	HTML5
•	CSS3
•	Vanilla JavaScript
•	Canvas API
Backend
•	Node.js
•	Express.js
Real-Time Communication
•	Socket.IO (WebSockets)

Setup Instructions

Prerequisites
•	Node.js (v16 or later)
•	npm (Node Package Manager)

Installation
1.	Clone or extract the project files
2.	Navigate to the project directory
3.	Install dependencies:
    npm install
4.	Running the Project
    npm start
5.	The application will start at:
    http://localhost:3000

How to Test with Multiple Users
1.	Open http://localhost:3000 in a browser
2.	Create a new room or join an existing room
3.	Copy the room code
4.	Open another browser window, incognito tab, or different device
5.	Join using the same room code
6.	Start drawing — all users will see updates in real time

Undo / Redo Behavior
•	Undo and redo are per user
•	Each stroke is assigned a unique ID
•	Undo removes the most recent stroke created by that user
•	Redo restores the last undone stroke
•	Undo/redo actions are synchronized across all connected users

User Management
•	The server maintains a list of connected users per room
•	Each user is assigned:
o	A unique name
o	A unique color
o	An activity state (Drawing / Idle)
•	The online users list updates in real time when users join or leave

Known Limitations
•	Canvas data is stored in memory only (resets on server restart)
•	No user authentication or persistent identity
•	No export or save feature for drawings
•	Performance may degrade with a large number of users
•	Touch and mobile support is limited

Time Spent on Development

Task	                       Time
UI Design & Layout	        5 hours
Canvas Drawing Logic	    4 hours
Real-Time Sync (Socket.IO)	4 hours
User Management	            2 hours
Undo / Redo Implementation	3 hours
Debugging & Refinement	    2 hours
Documentation	            1 hour
Total	                    21 hours

License

This project is developed for academic purposes and is released under the MIT License.

Conclusion

DrawTogether demonstrates the practical implementation of real-time collaborative systems using WebSockets.
The project highlights key concepts such as event-driven communication, shared state management, and concurrent user interaction in modern web applications.

Live Demo
Heroku is no longer free and Vercel does not support WebSockets.
This application is best tested locally.
Full setup instructions are provided above and the project has been
tested locally with multiple users across different browsers.



