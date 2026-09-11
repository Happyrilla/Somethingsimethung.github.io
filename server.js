const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const TMDB_API_KEY = process.env.TMDB_API_KEY;

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
let users = new Map();

// Serve static files
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/movies', async (req, res) => {
  if (!TMDB_API_KEY) {
    return res.status(500).json({
      error: 'TMDB_API_KEY is not configured on the server.'
    });
  }

  try {
    const query = (req.query.query || '').trim();
    const endpoint = query
      ? `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`
      : `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`;

    const tmdbResponse = await fetch(endpoint);

    if (!tmdbResponse.ok) {
      const errorText = await tmdbResponse.text();
      return res.status(tmdbResponse.status).json({
        error: 'TMDB request failed',
        details: errorText
      });
    }

    const data = await tmdbResponse.json();
    res.json(data.results || []);
  } catch (error) {
    console.error('Failed to fetch TMDB movies:', error);
    res.status(500).json({
      error: 'Failed to fetch TMDB movies',
      details: error.message
    });
  }
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
