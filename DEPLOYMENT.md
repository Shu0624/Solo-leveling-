# LevelUp Deployment Guide

LevelUp is architected to be flexible, supporting both modern **Vercel Serverless** deployment and **Persistent Host (Render / Railway / VPS)** deployment.

---

## 🚀 Option 1: 1-Click Vercel Deployment (Monorepo Standard)

The repository includes a modern zero-config `vercel.json` and a dedicated serverless entry point at `api/index.js`.

### How It Works:
- **Frontend**: Built via `cd client && npm install && npm run build` and served from `client/dist`.
- **API (`/api/*`)**: Handled natively by Vercel Serverless Functions via `api/index.js` (Express REST API with cached Mongoose pooling).
- **SPA Routing**: All client routes (`/dashboard`, `/profile`, `/modules`, etc.) rewrite to `/index.html`.

### Deployment Steps:
1. **Import Repository into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and select `Solo-leveling-`.
   - Keep **Root Directory** as `.` (root).
   - Framework Preset: **Vite** (or Other).
   - Build Command: `npm run build` (or leave default from `vercel.json`).
   - Output Directory: `client/dist`.

2. **Set Environment Variables in Vercel Dashboard**:
   Go to **Project Settings → Environment Variables**:
   | Variable | Value / Description | Required? |
   |---|---|---|
   | `MONGO_URI` | `mongodb+srv://...` (MongoDB Atlas connection string) | Yes (for persistent DB) |
   | `JWT_SECRET` | 64+ char random secret string | Yes |
   | `GROQ_API_KEY` | `gsk_...` (from console.groq.com) | Optional (for AI interview & roadmap) |
   | `NODE_ENV` | `production` | Recommended |
   | `ALLOW_DEMO_LOGIN` | `false` to switch off one-click demo access | Optional (defaults to on) |

3. **Instant Demo Access**:
   Even before MongoDB is configured, visitors can pick a role under **"Look around first"** on `/login` and get a working session.

   Demo sessions are served the built-in sample cohort and nothing else — they
   never read or write a real student record, and writes return
   `403 DEMO_READ_ONLY`. See `server/middleware/auth.js`. Set
   `ALLOW_DEMO_LOGIN=false` to disable them.

---

## ⚡ Option 2: Deploying Frontend Only on Vercel

If you prefer pointing Vercel specifically to the `client/` subdirectory:
1. In Vercel Project Settings, set **Root Directory** to `client`.
2. Vercel will automatically use `client/vercel.json` to handle client-side route rewrites.
3. Configure `VITE_API_URL` to point to your persistent backend host (e.g. `https://levelup-api.onrender.com/api`).
4. Configure `VITE_SOCKET_URL` to point to your persistent socket server (e.g. `https://levelup-api.onrender.com`).

---

## 🌐 Option 3: Persistent Server (Render / Railway / Fly.io)

For full real-time WebRTC peer signaling, Socket.IO group course chat, and automated daily midnight cron aggregation:

### Deploying on Render:
1. Create a **New Web Service** connected to your GitHub repo.
2. Root Directory: `server`.
3. Build Command: `npm install`.
4. Start Command: `npm start` (runs `node server.js`).
5. Environment Variables:
   - `MONGO_URI`: MongoDB Atlas connection string.
   - `JWT_SECRET`: Random 64+ character string.
   - `GROQ_API_KEY`: Groq API key.
   - `CLIENT_URL`: Your Vercel frontend URL (e.g. `https://levelup.vercel.app`).
   - `PORT`: `5000` (or leave unset, Render auto-injects).

---

## 🛠️ Verification & Health Checks

Once deployed, verify your endpoints:
- Frontend: `https://your-domain.vercel.app/`
- API Health Check: `https://your-domain.vercel.app/api/health`
  Returns JSON:
  ```json
  {
    "status": "ok",
    "uptime": 12.34,
    "timestamp": "2026-08-27T...",
    "environment": "production",
    "database": "connected"
  }
  ```
