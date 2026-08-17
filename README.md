# ANTI // MINIMAL UNDERGROUND SOUND

> A minimalist, production-ready music streaming website with a dark, experimental aesthetic. Built with pure HTML5, CSS3, Vanilla JavaScript, Node.js/Express, and MySQL.

---

## Features

- **Premium Dark UI** — Film grain, animated gradient blobs, subtle glow effects
- **Full Music Player** — Play, pause, previous, next, seek, volume, mute via HTML5 Audio API
- **Album Art Animation** — Rotating ring + floating effect while playing
- **Online Listener Counter** — Real-time pulse indicator with 20-second refresh
- **Track List Panel** — Slide-out playlist with active track highlight
- **Keyboard Shortcuts** — Space (play/pause), Arrows, M (mute)
- **Persistence** — `localStorage` for volume level + last selected track
- **Graceful Fallback** — Works without MySQL (demo mode)
- **Fully Responsive** — Mobile-first layout, touch-support for sliders
- **Secure** — Parameterized SQL queries, validated API inputs, env-based secrets

---

## Folder Structure

```
ANTI/
│
├── public/
│   ├── index.html              # Main page markup
│   ├── css/
│   │   └── style.css           # All styles + animations
│   ├── js/
│   │   └── app.js              # Music player, API client, UI logic
│   ├── images/
│   │   ├── bg.jpeg             # Album artwork (your image)
│   │   └── logo.svg            # ANTI favicon/logo
│   └── music/
│       └── (add sample.mp3 here)
│
├── server/
│   ├── server.js               # Express entry + static file host
│   ├── db.js                   # MySQL connection pool (parameterized)
│   └── routes/
│       ├── songs.js            # GET /api/songs, GET /api/songs/:id
│       ├── listeners.js        # POST /api/listeners, GET /api/listeners/count
│       └── settings.js         # GET /api/settings
│
├── database/
│   └── anti.sql                # Full schema + 5 sample songs + settings + playlists
│
├── .env.example                # DB + PORT variables (copy → .env)
├── package.json                # npm start / npm dev scripts
└── README.md                   # This file
```

---

## Local Setup

### Prerequisites

- **Node.js** >= 16 (LTS recommended). Download from [nodejs.org](https://nodejs.org/)
- **MySQL** >= 5.7 (or MariaDB 10+). Install locally or use a free cloud instance (see Hosting below).

---

### Step 1 — Install Dependencies

Open a terminal inside the `ANTI` folder:

```bash
cd ANTI
npm install
```

This installs: `express`, `mysql2`, `dotenv`, `cors`.

---

### Step 2 — Create the MySQL Database

Run the schema script to create the `anti_music` database, all tables, and seed data:

```bash
mysql -u root -p < database/anti.sql
```

Enter your MySQL root password when prompted.

> **Windows users**: If `mysql` is not in PATH, use the full path to your MySQL binary, e.g. `"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < database\anti.sql`

---

### Step 3 — Configure Environment Variables

Copy the example env file:

```bash
copy .env.example .env          # Windows (PowerShell)
# cp .env.example .env          # macOS/Linux
```

Then edit `.env` with your MySQL credentials:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=anti_music
PORT=3000
```

---

### Step 4 — Add Sample Audio

Place any MP3 file named `sample.mp3` inside `ANTI/public/music/`. The seed data points all 5 tracks at this file. For real usage, upload individual files and update each song's `audio_url` in the database.

> **No MP3?** The UI still works perfectly — only audio playback will be silent. The progress bar uses track durations from the database.

---

### Step 5 — Run the Server

**Production mode:**
```bash
npm start
```

**Development mode** (auto-restarts on file changes — Node 18+):
```bash
npm run dev
```

---

### Step 6 — Open in Browser

Visit [http://localhost:3000](http://localhost:3000)

Press **Space** to play. Enjoy the ANTI experience.

---

## VS Code Instructions

1. Open **VS Code**
2. Go to **File → Open Folder...**
3. Select the `ANTI` folder
4. Open the built-in terminal: **Terminal → New Terminal**
5. Run:
   ```bash
   npm install
   ```
6. Configure MySQL (steps 2 + 3 above)
7. Run:
   ```bash
   npm start
   ```
8. Open **http://localhost:3000** in your browser

---

## Keyboard Shortcuts

| Key              | Action                          |
|------------------|---------------------------------|
| `Space`          | Play / Pause                    |
| `←`              | Previous track                  |
| `→`              | Next track                      |
| `↑`              | Increase volume (5% step)       |
| `↓`              | Decrease volume (5% step)       |
| `M`              | Mute / Unmute                   |

---

## API Reference

All endpoints return JSON. If MySQL is unreachable, routes gracefully fall back to demo data rather than 5xx errors.

### Songs

| Method | Endpoint         | Description                  |
|--------|------------------|------------------------------|
| GET    | `/api/songs`     | Returns all songs (ordered)  |
| GET    | `/api/songs/:id` | Returns a single song by ID  |

**Response example:**
```json
{
  "id": 1,
  "title": "Afterglow",
  "artist": "ANTI",
  "album": "Midnight Sessions",
  "audio_url": "/music/sample.mp3",
  "cover_url": "/images/bg.jpeg",
  "duration": 245
}
```

### Listeners

| Method | Endpoint                 | Description                                             |
|--------|--------------------------|---------------------------------------------------------|
| POST   | `/api/listeners`         | Register/heartbeat a session. Body: `{ "session_id": "..." }` |
| GET    | `/api/listeners/count`   | Returns count of listeners active in the last 60s       |

**Count response:**
```json
{ "count": 42, "timeout_seconds": 60 }
```

### Settings

| Method | Endpoint        | Description                       |
|--------|-----------------|-----------------------------------|
| GET    | `/api/settings` | Key-value settings map (site name, tagline, timeouts, etc.) |

---

## Database Schema

Created by `database/anti.sql`:

| Table             | Columns                                                             |
|-------------------|---------------------------------------------------------------------|
| **songs**         | `id PK`, `title`, `artist`, `album`, `audio_url`, `cover_url`, `duration`, `created_at` |
| **listeners**     | `id PK`, `session_id UNIQUE`, `last_seen INDEX`, `created_at`      |
| **settings**      | `id PK`, `setting_key UNIQUE`, `setting_value`, `created_at`, `updated_at` |
| **playlists**     | `id PK`, `name`, `description`, `created_at`                       |
| **playlist_songs**| `(playlist_id PK, song_id PK)`, FKs cascade                         |

5 sample songs are inserted automatically: Afterglow, Void Walker, Neon Decay, Silent Static, Low Orbit.

---

## Security Notes

- All SQL uses **parameterized queries** (`?` placeholders) via `mysql2` — safe from SQL injection.
- Input validation on the `songs/:id` numeric param and `session_id` format/length.
- Database credentials live in `.env` only — never committed to source code.
- CORS is off by default (frontend + backend share the same origin). Enable in `server/server.js` if you split the frontend to a separate domain.
- No passwords are stored in the `listeners` table — only anonymous session IDs.

---

## Hosting (Beginner-Friendly)

You need three things: **frontend assets**, **Node.js backend**, and **MySQL database**. Here are the simplest free/low-cost combinations.

---

### Option A — Render (Full Stack All-in-One)

[Render.com](https://render.com) hosts Node.js + managed MySQL in one dashboard. Great for beginners.

1. **Create a MySQL Database** on Render (free tier available).
   - Copy the host, user, password, and database name.
2. **Create a new Web Service** → connect your GitHub repo.
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. In the service **Environment** tab, paste these variables:
   ```
   DB_HOST      → (from the Render MySQL page)
   DB_USER      → (from the Render MySQL page)
   DB_PASSWORD  → (from the Render MySQL page)
   DB_NAME      → (from the Render MySQL page)
   PORT         → 3000
   ```
4. Import the schema into Render's MySQL from your local machine:
   ```bash
   mysql -h render_hostname -u render_user -p render_dbname < database/anti.sql
   ```
5. Trigger a **Manual Deploy** → your site is live at `https://YOUR_APP.onrender.com`.

Upload your MP3s into `public/music/` in the repo before pushing.

---

### Option B — Railway (Node + MySQL)

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub repo.
2. Add a **MySQL** service in the same project.
3. Railway auto-injects `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQL_DATABASE` into the Node service. Update `server/db.js` or set aliases in Railway variables:
   ```
   DB_HOST=${{ MYSQLHOST }}
   DB_USER=${{ MYSQLUSER }}
   DB_PASSWORD=${{ MYSQLPASSWORD }}
   DB_NAME=${{ MYSQL_DATABASE }}
   ```
4. Run the SQL against Railway's MySQL using the credentials shown in the dashboard.

---

### Option C — Aiven (Managed MySQL) + Cloudflare Pages / Netlify (Frontend Split)

If you want to host the **frontend separately** from the backend (better scaling for static assets):

1. **Backend**: Deploy `server/` to Render (Option A step 2-3). CORS is already installed — in `server/server.js` add your frontend domain to the `cors()` options.
2. **Frontend**: Drag-and-drop the `public/` folder into [pages.cloudflare.com](https://pages.cloudflare.com) or [app.netlify.com/drop](https://app.netlify.com/drop). Update any absolute URLs in the frontend JS if needed (or use a relative `/api` with a Cloudflare Page Rule / Netlify redirect that proxies to your backend).
3. **Database**: Use [aiven.io/mysql](https://aiven.io/mysql) for a fully managed MySQL.

---

## Troubleshooting

### `Error: Access denied for user 'root'@'localhost'`
Your `.env` DB_PASSWORD is wrong, or your MySQL user differs. Double-check credentials. For non-root users, grant access first:
```sql
CREATE USER 'anti'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON anti_music.* TO 'anti'@'localhost';
FLUSH PRIVILEGES;
```

### `Error: Unknown database 'anti_music'`
Step 2 (running `anti.sql`) didn't complete. Run:
```bash
mysql -u root -p -e "SOURCE database/anti.sql;"
```

### `Cannot find module 'express'` or similar
Run `npm install` from inside the `ANTI` folder.

### `npm run dev` shows `node: bad option: --watch`
Upgrade Node.js to 18+ or use `npm start` instead. For watching on older Node:
```bash
npm i -D nodemon && npx nodemon server/server.js
```

### Port 3000 already in use
Change `PORT=3000` in `.env` to another port (e.g. `3001`), then restart.

### Music doesn't play (silent)
1. Confirm `public/music/sample.mp3` exists and is a valid MP3.
2. Open browser DevTools (F12) → Console — look for CORS or 404 errors.
3. Check Network tab for the `/music/sample.mp3` request — is it 200 OK?
4. Click the browser's speaker icon (tab title bar) to ensure the tab isn't muted.

### Album cover missing / broken image
Confirm `public/images/bg.jpeg` exists. Your browser may cache a 404 — hard refresh with **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac).

### Listener count shows `--` briefly or random numbers
This is expected: the frontend does an initial render before the first API response, and falls back to random demo numbers if MySQL is offline entirely.

---

## Customization Ideas

- **Add real songs**: Upload MP3s to `public/music/` with unique names, then `INSERT` rows into the `songs` table pointing at each.
- **Change colors**: Tweak the `--accent-1 / -2 / -3` blob colors near the top of `public/css/style.css`.
- **Remove film grain**: Delete the `.grain` div from `index.html` or set `opacity: 0` on `.grain` in CSS.
- **Slower/faster album spin**: Change `animation: rotateSlow 20s` to e.g. `30s` for slower, `12s` for faster.
- **Update site settings**: Edit the `settings` table rows directly in MySQL — they're reflected via `/api/settings`.

---

## Scripts

| Script          | What it does                              | Requires |
|-----------------|-------------------------------------------|----------|
| `npm start`     | Runs production server                    | Node 16+ |
| `npm run dev`   | Runs server with --watch (auto-restart)   | Node 18+ |

---

## License

MIT — Use freely. Replace placeholder branding, artwork, and audio with your own.
