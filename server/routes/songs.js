const express = require('express');
const router = express.Router();
const { scanMusicFolder } = require('../musicLibrary');

router.get('/', (req, res) => {
  const songs = scanMusicFolder();
  res.json(songs);
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid song ID' });
  }

  const songs = scanMusicFolder();
  const song = songs.find((s) => s.id === id);

  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }

  res.json(song);
});

module.exports = router;
