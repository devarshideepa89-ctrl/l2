CREATE DATABASE IF NOT EXISTS anti_music DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE anti_music;

DROP TABLE IF EXISTS playlist_songs;
DROP TABLE IF EXISTS playlists;
DROP TABLE IF EXISTS listeners;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS songs;

CREATE TABLE songs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    album VARCHAR(255) DEFAULT NULL,
    audio_url VARCHAR(500) NOT NULL,
    cover_url VARCHAR(500) NOT NULL,
    duration INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE listeners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_last_seen (last_seen)
);

CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE playlists (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE playlist_songs (
    playlist_id INT NOT NULL,
    song_id INT NOT NULL,
    PRIMARY KEY (playlist_id, song_id),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

INSERT INTO songs (title, artist, album, audio_url, cover_url, duration) VALUES
('3', 'Library', 'Music', '/music/3.mpeg', '/images/bg.jpeg', 0),
('4', 'Library', 'Music', '/music/4.mpeg', '/images/bg.jpeg', 0),
('Dee', 'Library', 'Music', '/music/dee.mpeg', '/images/bg.jpeg', 0),
('Ku', 'Library', 'Music', '/music/ku.mp3', '/images/bg.jpeg', 0),
('Poo', 'Library', 'Music', '/music/poo.mp3', '/images/bg.jpeg', 0),
('Ru', 'Library', 'Music', '/music/ru.mp3', '/images/bg.jpeg', 0);

INSERT INTO settings (setting_key, setting_value) VALUES
('site_name', 'ANTI'),
('site_tagline', 'MINIMAL UNDERGROUND SOUND'),
('site_description', 'Independent underground music label'),
('listener_timeout_seconds', '60'),
('listener_refresh_seconds', '20');

INSERT INTO playlists (name, description) VALUES
('Now Playing', 'Current rotation'),
('Deep Cuts', 'Hidden gems from the vault');

INSERT INTO playlist_songs (playlist_id, song_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(2, 6);
