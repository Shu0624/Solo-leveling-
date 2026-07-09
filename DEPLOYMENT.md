# Deployment Notes

## ⚠️ The API cannot run correctly on Vercel serverless

`server/server.js` depends on three things that a standard Vercel
`@vercel/node` serverless function does **not** provide:

| Feature | Where | Why serverless breaks it |
|---|---|---|
| Real-time sessions, chat, WebRTC signaling | `socket.io` (`server.js`) | Serverless functions are short-lived and don't hold open WebSocket connections. |
| Analytics aggregation + daily AI discovery | `node-cron` schedules (`server.js`) | Cron only fires inside a continuously running process; a function that spins up per request never runs them. |
| Active-session / heartbeat tracking | in-memory state in `services/sessionManager.js` | Each invocation gets a fresh process, so in-memory state does not persist across requests. |

The current `vercel.json` routes `/api/*` to `server/server.js` as a
serverless function, so in production these features silently do nothing.

## Recommended setup

Split the deployment:

1. **Client** → Vercel static build (already configured: `client/dist`).
2. **API + Socket.IO** → a persistent host that keeps a process alive:
   Render, Railway, Fly.io, or a small VM. Point the client's
   `VITE_API_URL` / `VITE_SOCKET_URL` at that host.

If you must stay fully on Vercel:

- Move cron work to **Vercel Cron Jobs** hitting a protected HTTP endpoint
  that calls `runAggregation` / `runDailyDiscovery`.
- Move real-time features to a managed WebSocket service (e.g. Ably,
  Pusher) or a separate always-on socket server.
- Move active-session state to a shared store (Redis / MongoDB) instead of
  process memory.

## Required environment variables

See `server/.env.example`. At minimum `MONGO_URI` and `JWT_SECRET` are
required (the server fails fast without them). Set `NODE_ENV=production`
in production so demo/sample data and verbose error output stay off.
