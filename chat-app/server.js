const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
let messages = [];

// Serve static files from current directory
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  const userId = socket.id;
  console.log('New user connected:', userId);

  // Send existing messages to new user
  socket.emit('load_messages', messages);

  // Handle new message
  socket.on('send_message', (data) => {
    const message = {
      id: Date.now(),
      name: data.name || 'Anonymous',
      content: data.content,
      user_id: userId,
      created_at: new Date().toISOString()
    };

    messages.push(message);
    // Keep only last 500 messages
    if (messages.length > 500) {
      messages.shift();
    }

    // Broadcast to all users
    io.emit('new_message', message);
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', userId);
  });
});

server.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
});
