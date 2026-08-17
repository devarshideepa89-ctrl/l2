const express = require('express');
const router = express.Router();
const db = require('../db');

const DEFAULT_SETTINGS = [
  { setting_key: 'site_name', setting_value: 'ANTI' },
  { setting_key: 'site_tagline', setting_value: 'MINIMAL UNDERGROUND SOUND' },
  { setting_key: 'site_description', setting_value: 'Independent underground music label' },
  { setting_key: 'listener_timeout_seconds', setting_value: '60' },
  { setting_key: 'listener_refresh_seconds', setting_value: '20' }
];

function settingsArrayToObject(arr) {
  const obj = {};
  arr.forEach(s => {
    obj[s.setting_key] = s.setting_value;
  });
  return obj;
}

router.get('/', async (req, res) => {
  try {
    const settings = await db.query(
      'SELECT setting_key, setting_value FROM settings'
    );
    if (settings.length === 0) {
      return res.json(settingsArrayToObject(DEFAULT_SETTINGS));
    }
    res.json(settingsArrayToObject(settings));
  } catch (err) {
    console.error('[SETTINGS] Error fetching settings:', err.message);
    res.json(settingsArrayToObject(DEFAULT_SETTINGS));
  }
});

module.exports = router;
