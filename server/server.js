const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db');
const songsRouter = require('./routes/songs');
const listenersRouter = require('./routes/listeners');
const settingsRouter = require('./routes/settings');

const app = express();
const preferredPort = parseInt(process.env.PORT, 10) || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/music', express.static(path.join(__dirname, '..', 'music')));

app.use('/api/songs', songsRouter);
app.use('/api/listeners', listenersRouter);
app.use('/api/settings', settingsRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('[SERVER] Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

async function listenOnAvailablePort(startPort, maxAttempts = 100) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const port = startPort + attempt;

    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(port, () => resolve(server));
        server.on('error', reject);
      });

      if (port !== startPort) {
        console.log(`[SERVER] Port ${startPort} is busy.`);
        console.log(`[SERVER] Using available port ${port}.`);
      }

      console.log('');
      console.log(`[SERVER] Server running at http://localhost:${port}`);
      console.log('[SERVER] Press Ctrl+C to stop');
      console.log('');
      return port;
    } catch (err) {
      if (err.code !== 'EADDRINUSE') {
        throw err;
      }
    }
  }

  throw new Error(`No available port found between ${startPort} and ${startPort + maxAttempts - 1}`);
}

async function startServer() {
  console.log('========================================');
  console.log('  ANTI MUSIC PLATFORM');
  console.log('  Minimal Underground Sound');
  console.log('========================================');
  console.log('');

  const dbConnected = await db.testConnection();
  if (dbConnected) {
    console.log('[DB] Connected to MySQL successfully');
  } else {
    console.log('[DB] Warning: Database not connected. API will use demo mode.');
  }

  await listenOnAvailablePort(preferredPort);
}

startServer().catch((err) => {
  console.error('[SERVER] Failed to start:', err.message);
  process.exit(1);
});
