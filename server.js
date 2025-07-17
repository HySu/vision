const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3001;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

app.use(express.static(path.join(__dirname, 'build')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

let server;
let io;

if (process.env.NODE_ENV === 'production' || process.env.HTTPS === 'true') {
  try {
    const options = {
      key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem'))
    };

    server = https.createServer(options, app);
    io = new Server(server, {
      cors: {
        origin: [`https://localhost:${HTTPS_PORT}`, "https://localhost:3000"],
        methods: ["GET", "POST"]
      }
    });

    server.listen(HTTPS_PORT, () => {
      console.log(`🔒 HTTPS Server running on https://localhost:${HTTPS_PORT}`);
    });
  } catch (error) {
    console.error('SSL certificate error:', error);
    console.log('Falling back to HTTP server...');
    
    server = http.createServer(app);
    io = new Server(server, {
      cors: {
        origin: [`http://localhost:${PORT}`, "http://localhost:3000"],
        methods: ["GET", "POST"]
      }
    });

    server.listen(PORT, () => {
      console.log(`🔓 HTTP Server running on http://localhost:${PORT}`);
    });
  }
} else {
  server = http.createServer(app);
  io = new Server(server, {
    cors: {
      origin: [`http://localhost:${PORT}`, "http://localhost:3000"],
      methods: ["GET", "POST"]
    }
  });

  server.listen(PORT, () => {
    console.log(`🔓 HTTP Server running on http://localhost:${PORT}`);
  });
}

const rooms = new Map();
const users = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId, userName }) => {
    console.log(`🔗 User ${userName} (${socket.id}) trying to join room ${roomId}`);
    
    socket.join(roomId);
    
    const user = {
      id: socket.id,
      name: userName,
      roomId: roomId
    };
    
    users.set(socket.id, user);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    
    rooms.get(roomId).add(socket.id);
    
    // Notify existing users about new user
    socket.to(roomId).emit('user-joined', user);
    
    // Send current room users to new user
    const roomUsers = Array.from(rooms.get(roomId)).map(userId => users.get(userId));
    socket.emit('room-users', roomUsers);
    
    console.log(`✅ User ${userName} joined room ${roomId}. Room now has ${roomUsers.length} users`);
    console.log(`📋 Current users in room ${roomId}:`, roomUsers.map(u => u.name));
  });

  socket.on('offer', ({ offer, to }) => {
    console.log(`📞 Offer from ${socket.id} to ${to}`);
    socket.to(to).emit('offer', {
      offer: offer,
      from: socket.id
    });
  });

  socket.on('answer', ({ answer, to }) => {
    console.log(`📞 Answer from ${socket.id} to ${to}`);
    socket.to(to).emit('answer', {
      answer: answer,
      from: socket.id
    });
  });

  socket.on('ice-candidate', ({ candidate, to }) => {
    console.log(`🧊 ICE candidate from ${socket.id} to ${to}`);
    socket.to(to).emit('ice-candidate', {
      candidate: candidate,
      from: socket.id
    });
  });

  socket.on('chat-message', ({ message, roomId }) => {
    const user = users.get(socket.id);
    if (user && rooms.has(roomId)) {
      io.to(roomId).emit('chat-message', {
        message: message,
        sender: user.name,
        senderId: socket.id,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('media-state', ({ roomId, isCameraOn, isMicOn }) => {
    const user = users.get(socket.id);
    if (user && rooms.has(roomId)) {
      socket.to(roomId).emit('user-media-state', {
        userId: socket.id,
        isCameraOn: isCameraOn,
        isMicOn: isMicOn
      });
    }
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      const roomId = user.roomId;
      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(socket.id);
        if (rooms.get(roomId).size === 0) {
          rooms.delete(roomId);
        } else {
          socket.to(roomId).emit('user-left', { userId: socket.id });
        }
      }
      users.delete(socket.id);
      console.log(`User ${user.name} disconnected from room ${roomId}`);
    }
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});