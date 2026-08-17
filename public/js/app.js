(function () {
    'use strict';

    const FALLBACK_SONGS = [
        { id: 1, title: '3', artist: 'Library', album: 'Music', audio_url: '/music/3.mpeg', cover_url: '/images/bg.jpeg', duration: 0 },
        { id: 2, title: '4', artist: 'Library', album: 'Music', audio_url: '/music/4.mpeg', cover_url: '/images/bg.jpeg', duration: 0 },
        { id: 3, title: 'Dee', artist: 'Library', album: 'Music', audio_url: '/music/dee.mpeg', cover_url: '/images/bg.jpeg', duration: 0 },
        { id: 4, title: 'Ku', artist: 'Library', album: 'Music', audio_url: '/music/ku.mp3', cover_url: '/images/bg.jpeg', duration: 0 },
        { id: 5, title: 'Poo', artist: 'Library', album: 'Music', audio_url: '/music/poo.mp3', cover_url: '/images/bg.jpeg', duration: 0 },
        { id: 6, title: 'Ru', artist: 'Library', album: 'Music', audio_url: '/music/ru.mp3', cover_url: '/images/bg.jpeg', duration: 0 }
    ];

    const state = {
        songs: [],
        currentIndex: 0,
        isPlaying: false,
        volume: parseFloat(localStorage.getItem('anti_volume')) || 0.8,
        previousVolume: 0.8,
        isMuted: false,
        sessionId: null,
        listenerRefreshInterval: null,
        isSeeking: false
    };

    const el = {};

    function qs(id) {
        return document.getElementById(id);
    }

    function cacheElements() {
        el.audio = qs('audioPlayer');
        el.playBtn = qs('playBtn');
        el.prevBtn = qs('prevBtn');
        el.nextBtn = qs('nextBtn');
        el.trackTitle = qs('trackTitle');
        el.trackArtist = qs('trackArtist');
        el.coverImage = qs('coverImage');
        el.albumRing = qs('albumRing');
        el.albumGlow = qs('albumGlow');
        el.currentTime = qs('currentTime');
        el.totalTime = qs('totalTime');
        el.progressWrapper = qs('progressWrapper');
        el.progressBar = qs('progressBar');
        el.progressFill = qs('progressFill');
        el.progressHandle = qs('progressHandle');
        el.volumeBtn = qs('volumeBtn');
        el.volumeWrapper = qs('volumeWrapper');
        el.volumeFill = qs('volumeFill');
        el.volumeHandle = qs('volumeHandle');
        el.listenerCount = qs('listenerCount');
        el.listenerDot = qs('listenerDot');
        el.trackListBtn = qs('trackListBtn');
        el.trackListPanel = qs('trackListPanel');
        el.trackList = qs('trackList');
        el.closeTrackList = qs('closeTrackList');
    }

    function formatTime(seconds) {
        if (!isFinite(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function generateSessionId() {
        const stored = localStorage.getItem('anti_session_id');
        if (stored && stored.length >= 8) return stored;
        const bytes = new Uint8Array(16);
        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(bytes);
        } else {
            for (let i = 0; i < bytes.length; i++) {
                bytes[i] = Math.floor(Math.random() * 256);
            }
        }
        let hex = '';
        for (let i = 0; i < bytes.length; i++) {
            hex += bytes[i].toString(16).padStart(2, '0');
        }
        localStorage.setItem('anti_session_id', hex);
        return hex;
    }

    async function fetchSongs() {
        try {
            const res = await fetch('/api/songs', {
                headers: { 'Accept': 'application/json' }
            });
            if (!res.ok) throw new Error('Network response not ok');
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                state.songs = data;
                return;
            }
        } catch (err) {
            console.warn('[ANTI] Using fallback song list:', err.message);
        }
        state.songs = [...FALLBACK_SONGS];
    }

    async function registerListener() {
        state.sessionId = generateSessionId();
        try {
            await fetch('/api/listeners', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ session_id: state.sessionId })
            });
        } catch (err) {
            console.warn('[ANTI] Listener registration failed:', err.message);
        }
    }

    async function updateListenerCount() {
        try {
            const res = await fetch('/api/listeners/count', {
                headers: { 'Accept': 'application/json' }
            });
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            if (data && typeof data.count === 'number') {
                el.listenerCount.textContent = data.count.toString();
                return;
            }
        } catch (err) {
            // silent
        }
        const demo = 15 + Math.floor(Math.random() * 25);
        el.listenerCount.textContent = demo.toString();
    }

    function startListenerRefresh() {
        updateListenerCount();
        state.listenerRefreshInterval = setInterval(() => {
            registerListener();
            updateListenerCount();
        }, 20000);
    }

    function getInitialTrackIndex() {
        const saved = parseInt(localStorage.getItem('anti_last_track'), 10);
        if (!isNaN(saved) && saved >= 0 && saved < state.songs.length) {
            return saved;
        }
        return 0;
    }

    function loadTrack(index, autoplay = false) {
        if (index < 0) index = state.songs.length - 1;
        if (index >= state.songs.length) index = 0;

        state.currentIndex = index;
        localStorage.setItem('anti_last_track', index.toString());

        const song = state.songs[index];
        if (!song) return;

        el.trackTitle.textContent = song.title || 'Unknown Title';
        el.trackArtist.textContent = song.artist ? `— ${song.artist}` : '—';
        el.coverImage.src = song.cover_url || '/images/bg.jpeg';
        el.audio.src = song.audio_url || '';
        el.totalTime.textContent = formatTime(song.duration || 0);

        el.progressFill.style.width = '0%';
        el.progressHandle.style.left = '0%';
        el.currentTime.textContent = '0:00';

        renderTrackList();

        if (autoplay) {
            playAudio();
        }
    }

    function playAudio() {
        const p = el.audio.play();
        if (p && typeof p.catch === 'function') {
            p.catch(err => {
                console.warn('[ANTI] Play failed:', err.message);
                setPlaying(false);
            });
        }
        setPlaying(true);
    }

    function pauseAudio() {
        el.audio.pause();
        setPlaying(false);
    }

    function togglePlay() {
        if (state.isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    }

    function setPlaying(playing) {
        state.isPlaying = playing;
        if (playing) {
            el.playBtn.classList.add('playing');
            el.albumRing.classList.add('playing');
            el.albumGlow.classList.add('active');
        } else {
            el.playBtn.classList.remove('playing');
            el.albumRing.classList.remove('playing');
            el.albumGlow.classList.remove('active');
        }
    }

    function prevTrack() {
        let newIndex = state.currentIndex - 1;
        if (newIndex < 0) newIndex = state.songs.length - 1;
        loadTrack(newIndex, state.isPlaying || true);
    }

    function nextTrack() {
        let newIndex = state.currentIndex + 1;
        if (newIndex >= state.songs.length) newIndex = 0;
        loadTrack(newIndex, state.isPlaying || true);
    }

    function seekTo(clientX) {
        const rect = el.progressBar.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        const duration = el.audio.duration || state.songs[state.currentIndex]?.duration || 0;
        const time = ratio * duration;
        if (isFinite(time) && time >= 0) {
            el.audio.currentTime = time;
            updateProgressUI(time, duration);
        }
    }

    function updateProgressUI(current, duration) {
        const ratio = duration > 0 ? (current / duration) : 0;
        const pct = (ratio * 100).toFixed(2) + '%';
        el.progressFill.style.width = pct;
        el.progressHandle.style.left = pct;
        el.currentTime.textContent = formatTime(current);
    }

    function onAudioTimeUpdate() {
        if (state.isSeeking) return;
        updateProgressUI(el.audio.currentTime, el.audio.duration || 0);
    }

    function onAudioLoadedMetadata() {
        if (el.audio.duration) {
            el.totalTime.textContent = formatTime(el.audio.duration);
        }
    }

    function onAudioEnded() {
        nextTrack();
    }

    function setVolume(value, save = true) {
        value = Math.min(1, Math.max(0, value));
        state.volume = value;
        if (!state.isMuted) {
            el.audio.volume = value;
        }
        const pct = (value * 100).toFixed(2) + '%';
        el.volumeFill.style.width = pct;
        el.volumeHandle.style.left = pct;

        if (value === 0) {
            state.isMuted = true;
            el.volumeBtn.classList.add('muted');
        } else if (state.isMuted) {
            state.isMuted = false;
            el.volumeBtn.classList.remove('muted');
            el.audio.volume = value;
        }

        if (save) {
            localStorage.setItem('anti_volume', value.toString());
        }
    }

    function setVolumeFromClientX(clientX) {
        const rect = el.volumeWrapper.querySelector('.volume-bar').getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        setVolume(ratio);
    }

    function toggleMute() {
        if (state.isMuted) {
            state.isMuted = false;
            el.volumeBtn.classList.remove('muted');
            const restore = state.volume > 0 ? state.volume : state.previousVolume || 0.8;
            el.audio.volume = restore;
            setVolume(restore, false);
        } else {
            state.previousVolume = state.volume;
            state.isMuted = true;
            el.volumeBtn.classList.add('muted');
            el.audio.volume = 0;
            setVolume(0, false);
        }
    }

    function renderTrackList() {
        if (!el.trackList) return;
        el.trackList.innerHTML = '';

        state.songs.forEach((song, index) => {
            const item = document.createElement('div');
            item.className = 'track-item' + (index === state.currentIndex ? ' active' : '');
            item.addEventListener('click', () => {
                const wasPlaying = state.isPlaying;
                loadTrack(index, true);
            });

            const cover = document.createElement('div');
            cover.className = 'track-item-cover';
            const img = document.createElement('img');
            img.src = song.cover_url || '/images/bg.jpeg';
            img.alt = song.title || '';
            img.onerror = function () { this.src = '/images/bg.jpeg'; };
            cover.appendChild(img);

            const info = document.createElement('div');
            info.className = 'track-item-info';

            const title = document.createElement('div');
            title.className = 'track-item-title';
            title.textContent = song.title || 'Untitled';

            const artist = document.createElement('div');
            artist.className = 'track-item-artist';
            artist.textContent = song.artist || 'Unknown';

            info.appendChild(title);
            info.appendChild(artist);

            const duration = document.createElement('div');
            duration.className = 'track-item-duration';
            duration.textContent = formatTime(song.duration || 0);

            item.appendChild(cover);
            item.appendChild(info);
            item.appendChild(duration);

            el.trackList.appendChild(item);
        });
    }

    function openTrackList() {
        el.trackListPanel.classList.add('open');
    }

    function closeTrackList() {
        el.trackListPanel.classList.remove('open');
    }

    function setupProgressHandlers() {
        function onDown(e) {
            state.isSeeking = true;
            const x = e.touches ? e.touches[0].clientX : e.clientX;
            seekTo(x);
            e.preventDefault();

            function onMove(ev) {
                const mx = ev.touches ? ev.touches[0].clientX : ev.clientX;
                seekTo(mx);
            }

            function onUp() {
                state.isSeeking = false;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend', onUp);
            }

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onUp);
        }

        el.progressWrapper.addEventListener('mousedown', onDown);
        el.progressWrapper.addEventListener('touchstart', onDown, { passive: false });
    }

    function setupVolumeHandlers() {
        function onDown(e) {
            const x = e.touches ? e.touches[0].clientX : e.clientX;
            setVolumeFromClientX(x);
            e.preventDefault();

            function onMove(ev) {
                const mx = ev.touches ? ev.touches[0].clientX : ev.clientX;
                setVolumeFromClientX(mx);
            }

            function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend', onUp);
            }

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onUp);
        }

        el.volumeWrapper.addEventListener('mousedown', onDown);
        el.volumeWrapper.addEventListener('touchstart', onDown, { passive: false });
    }

    function setupControlButtons() {
        el.playBtn.addEventListener('click', togglePlay);
        el.prevBtn.addEventListener('click', prevTrack);
        el.nextBtn.addEventListener('click', nextTrack);
        el.volumeBtn.addEventListener('click', toggleMute);
        el.trackListBtn.addEventListener('click', openTrackList);
        el.closeTrackList.addEventListener('click', closeTrackList);
    }

    function setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
            if (e.code === 'Space') {
                e.preventDefault();
                togglePlay();
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                nextTrack();
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                prevTrack();
            } else if (e.code === 'ArrowUp') {
                e.preventDefault();
                setVolume(state.volume + 0.05);
            } else if (e.code === 'ArrowDown') {
                e.preventDefault();
                setVolume(state.volume - 0.05);
            } else if (e.code === 'KeyM') {
                e.preventDefault();
                toggleMute();
            }
        });
    }

    function setupAudioEvents() {
        el.audio.addEventListener('timeupdate', onAudioTimeUpdate);
        el.audio.addEventListener('loadedmetadata', onAudioLoadedMetadata);
        el.audio.addEventListener('ended', onAudioEnded);
        el.audio.addEventListener('play', () => setPlaying(true));
        el.audio.addEventListener('pause', () => setPlaying(false));
        el.audio.addEventListener('error', () => {
            console.warn('[ANTI] Audio error, advancing to next track');
            setTimeout(() => {
                if (state.isPlaying) nextTrack();
            }, 1500);
        });
    }

    async function init() {
        cacheElements();

        await fetchSongs();

        const initialIndex = getInitialTrackIndex();
        loadTrack(initialIndex, false);

        setVolume(state.volume, false);
        if (state.volume === 0) {
            state.isMuted = true;
            el.volumeBtn.classList.add('muted');
        }

        setupAudioEvents();
        setupControlButtons();
        setupProgressHandlers();
        setupVolumeHandlers();
        setupKeyboard();

        registerListener();
        startListenerRefresh();

        console.log('%c ANTI ', 'background: #fff; color: #000; font-size: 20px; font-weight: bold; padding: 4px 10px; border-radius: 4px;');
        console.log('%c Minimal Underground Sound ', 'color: #888; font-style: italic;');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
