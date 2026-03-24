# Deployment Guide

This project is ready for split hosting:
- Frontend on Vercel (`client/`)
- Backend API on Render (`server/`)
- Database on MongoDB Atlas

## 0) Database Setup (MongoDB Atlas)

Before deploying the API, you need a live database:
1. Go to [MongoDB Atlas](https://cloud.mongodb.com) and create a free M0 cluster.
   - *Tip for users in India:* Select AWS and the **Singapore (ap-southeast-1)** region for the lowest latency with a Render backend also hosted in Singapore.
2. Under "Database Access", create a database user with a strong password.
3. Under "Network Access", add `0.0.0.0/0` (Allow access from anywhere) so Render can connect.
4. Click "Connect" -> "Drivers" to get your connection string. It will look like: `mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/?retryWrites=true&w=majority`
5. Append `taskdep` to the database name path: `mongodb+srv://...mongodb.net/taskdep?...`

Save this complete connection string; you'll use it as your `MONGO_URI` environment variable.


## 1) Deploy API (Render)

Use the root [`render.yaml`](./render.yaml) blueprint or create a web service manually.

### Render service settings
- Root Directory: `server`
- Build Command: `npm ci`
- Start Command: `npm start`
- Runtime: Node 20+

### If Render does not auto-deploy after push
In monorepo setups, Render may only deploy when files under the service root change.

Check these in Render service settings:
- Auto Deploy: **On**
- Branch: **main** (or your production branch)
- Root Directory: **server**
- Build Filters / Ignored Paths: make sure you are not excluding valid backend changes

Important: if you only change root-level files (for example `.gitignore`) and no files under `server/`, Render may skip deploy while Vercel still deploys.

### Required environment variables
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL` (your Vercel frontend URL, can be comma-separated)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Optional email variables:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`
- `FROM_EMAIL`

### Health check
- `GET /api/health`

### If deploy is slow and logs show "Port scan timeout"
If logs contain "Port scan timeout reached, no open ports detected", your app is not binding `PORT` quickly enough.

Use this startup pattern:
- Start Express listener immediately on `process.env.PORT`
- Connect MongoDB after server starts
- Use a bounded Mongo server selection timeout (for example 15s)
- Exit fast on DB connect failure so Render fails quickly instead of waiting many minutes

### Free-tier cold start mitigation (if you cannot upgrade yet)
Render free instances can sleep and add 30-60s to the first API request.

Use an external uptime monitor (for example UptimeRobot) to ping:
- `https://<your-render-service>.onrender.com/api/health`
- Interval: every 10 minutes
- Method: `GET`

This keeps the service warm and removes most first-request delay for users.

## 2) Deploy Frontend (Vercel)

Create a Vercel project from the `client/` directory.

### Build settings
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

### Required environment variable
- `VITE_API_URL=https://<your-render-service>.onrender.com/api`

The frontend API client reads `VITE_API_URL` and falls back to `/api` in local development.

## 3) Post-deploy checklist

1. Open frontend and confirm login/register works.
2. Create a task and ensure task list loads.
3. Upload a file attachment and verify preview/download.
4. Export tasks (`CSV`, `JSON`, `TXT`) to confirm API route access.
5. Confirm browser console has no CORS errors.
