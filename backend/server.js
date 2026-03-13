const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const redis = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

const app = express();

// Middleware
app.use(cors({ origin: ['http://127.0.0.1:5500', 'http://localhost:5500'] }));
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rps',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Test DB connection
pool.connect((err) => {
  if (err) {
    console.error('❌ PostgreSQL connection error:', err);
  } else {
    console.log('✅ PostgreSQL connected');
    // Create table if not exists
    pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        username VARCHAR(255) PRIMARY KEY,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0
      )
    `);
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    methods: ['GET', 'POST']
  }
});

// Redis adapter for multi-instance support
const pubClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log('✅ Redis adapter connected');
});

// Game state (still in-memory, but shared via Redis adapter)
let waitingPlayers = [];
const games = {};

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('ready', (username) => {
    console.log(`🎮 ${username} is ready`);

    waitingPlayers.push({ username, socketId: socket.id });

    if (waitingPlayers.length >= 2) {
      const player1 = waitingPlayers.shift();
      const player2 = waitingPlayers.shift();

      const room = `game_${player1.socketId}_${player2.socketId}`;

      socket.join(room);
      io.sockets.sockets.get(player2.socketId)?.join(room);

      games[room] = {
        player1: { username: player1.username, socketId: player1.socketId, choice: null },
        player2: { username: player2.username, socketId: player2.socketId, choice: null }
      };

      io.to(player1.socketId).emit('gameStart', { opponent: player2.username, room, myRole: 'player1' });
      io.to(player2.socketId).emit('gameStart', { opponent: player1.username, room, myRole: 'player2' });

      console.log(`✅ Game started in room ${room}: ${player1.username} (p1) vs ${player2.username} (p2)`);
    }
  });

  socket.on('move', async ({ choice, room }) => {
    const game = games[room];
    if (!game) return;

    let player, opponent;
    if (game.player1.socketId === socket.id) {
      player = game.player1;
      opponent = game.player2;
    } else if (game.player2.socketId === socket.id) {
      player = game.player2;
      opponent = game.player1;
    } else {
      return;
    }

    player.choice = choice;
    console.log(`${player.username} chose ${choice} in room ${room}`);

    if (game.player1.choice && game.player2.choice) {
      const p1Choice = game.player1.choice;
      const p2Choice = game.player2.choice;
      let winner;

      if (p1Choice === p2Choice) {
        winner = 'tie';
      } else if (
        (p1Choice === 'rock' && p2Choice === 'scissors') ||
        (p1Choice === 'paper' && p2Choice === 'rock') ||
        (p1Choice === 'scissors' && p2Choice === 'paper')
      ) {
        winner = 'player1';
      } else {
        winner = 'player2';
      }

      // Update scores in PostgreSQL
      try {
        if (winner === 'player1') {
          await pool.query('UPDATE users SET wins = wins + 1 WHERE username = $1', [game.player1.username]);
          await pool.query('UPDATE users SET losses = losses + 1 WHERE username = $1', [game.player2.username]);
        } else if (winner === 'player2') {
          await pool.query('UPDATE users SET wins = wins + 1 WHERE username = $1', [game.player2.username]);
          await pool.query('UPDATE users SET losses = losses + 1 WHERE username = $1', [game.player1.username]);
        }
      } catch (err) {
        console.error('❌ Error updating scores:', err);
      }

      io.to(room).emit('roundResult', {
        p1Choice: game.player1.choice,
        p2Choice: game.player2.choice,
        winner
      });

      game.player1.choice = null;
      game.player2.choice = null;
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);

    waitingPlayers = waitingPlayers.filter(p => p.socketId !== socket.id);

    for (const [room, game] of Object.entries(games)) {
      if (game.player1.socketId === socket.id || game.player2.socketId === socket.id) {
        const otherSocketId = game.player1.socketId === socket.id
          ? game.player2.socketId
          : game.player1.socketId;
        io.to(otherSocketId).emit('opponentDisconnected');
        delete games[room];
        break;
      }
    }
  });
});

// API Routes

// Register/login a user
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });

    // Insert or ignore (PostgreSQL UPSERT)
    const result = await pool.query(
      `INSERT INTO users (username) VALUES ($1)
       ON CONFLICT (username) DO NOTHING
       RETURNING *`,
      [username]
    );
    // If user already existed, fetch it
    if (result.rows.length === 0) {
      const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      return res.json(user.rows[0]);
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by username
app.get('/api/users/:username', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [req.params.username]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

server.listen(3000, () => {
  console.log('🚀 Backend server running at http://localhost:3000');
});