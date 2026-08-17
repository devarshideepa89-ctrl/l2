const express = require('express');
const router = express.Router();
const db = require('../db');

const DEMO_LISTENER_BASE = 12;
const demoListeners = new Set();

function generateDemoCount() {
  const randomNoise = Math.floor(Math.random() * 30);
  return DEMO_LISTENER_BASE + randomNoise + demoListeners.size;
}

function getListenerTimeout() {
  return 60;
}

function isValidSessionId(sessionId) {
  if (typeof sessionId !== 'string') return false;
  if (sessionId.length < 8 || sessionId.length > 100) return false;
  return /^[a-zA-Z0-9_-]+$/.test(sessionId);
}

router.post('/', async (req, res) => {
  const { session_id } = req.body || {};

  if (!session_id || !isValidSessionId(session_id)) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  try {
    const existing = await db.query(
      'SELECT id FROM listeners WHERE session_id = ?',
      [session_id]
    );

    if (existing.length > 0) {
      await db.query(
        'UPDATE listeners SET last_seen = NOW() WHERE session_id = ?',
        [session_id]
      );
    } else {
      await db.query(
        'INSERT INTO listeners (session_id, last_seen) VALUES (?, NOW())',
        [session_id]
      );
    }

    res.json({ success: true, session_id });
  } catch (err) {
    console.error('[LISTENERS] Error updating listener:', err.message);
    demoListeners.add(session_id);
    res.json({ success: true, session_id, demo: true });
  }
});

router.get('/count', async (req, res) => {
  const timeoutSeconds = getListenerTimeout();

  try {
    const results = await db.query(
      'SELECT COUNT(*) as count FROM listeners WHERE last_seen >= NOW() - INTERVAL ? SECOND',
      [timeoutSeconds]
    );
    const count = results[0]?.count || 0;
    res.json({
      count: parseInt(count, 10),
      timeout_seconds: timeoutSeconds
    });
  } catch (err) {
    console.error('[LISTENERS] Error counting listeners:', err.message);
    res.json({
      count: generateDemoCount(),
      timeout_seconds: timeoutSeconds,
      demo: true
    });
  }
});

module.exports = router;
