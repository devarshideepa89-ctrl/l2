const fs = require('fs');
const path = require('path');

const MUSIC_DIR = path.join(__dirname, '..', 'music');

const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.mpeg',
  '.mpg',
  '.wav',
  '.ogg',
  '.m4a',
  '.flac',
  '.aac',
  '.opus',
  '.wma',
  '.webm'
]);

function titleFromFilename(filename) {
  const base = path.basename(filename, path.extname(filename));
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toAudioUrl(filename) {
  return `/music/${encodeURIComponent(filename)}`;
}

function scanMusicFolder() {
  if (!fs.existsSync(MUSIC_DIR)) {
    console.warn('[MUSIC] Folder not found:', MUSIC_DIR);
    return [];
  }

  let entries;
  try {
    entries = fs.readdirSync(MUSIC_DIR, { withFileTypes: true });
  } catch (err) {
    console.error('[MUSIC] Failed to read folder:', err.message);
    return [];
  }

  const songs = entries
    .filter((entry) => entry.isFile())
    .filter((entry) => AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
    .map((entry, index) => ({
      id: index + 1,
      title: titleFromFilename(entry.name),
      artist: 'Library',
      album: 'Music',
      audio_url: toAudioUrl(entry.name),
      cover_url: '/images/bg.jpeg',
      duration: 0,
      created_at: new Date().toISOString()
    }));

  console.log(`[MUSIC] Loaded ${songs.length} track(s) from /music/`);
  return songs;
}

module.exports = {
  MUSIC_DIR,
  scanMusicFolder,
  toAudioUrl,
  titleFromFilename
};
