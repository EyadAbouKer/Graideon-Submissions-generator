# Railway Deployment Guide

## Setup

1. **Create a Railway account** at https://railway.app

2. **Create a new project** from your GitHub repository

3. **Add PostgreSQL database**:
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will automatically create a `DATABASE_URL` environment variable

4. **Configure environment variables**:
   Add these variables in Railway dashboard (Settings → Variables):
   ```
   SESSION_SECRET=your-secret-key-here
   GOOGLE_API_KEY=your-google-api-key
   ADMIN_EMAIL=devops@graideon.com
   ADMIN_PASSWORD_HASH=your-password-hash
   PORT=8000
   ```

5. **Deploy**:
   - Railway will automatically detect `nixpacks.toml` and build your app
   - The build process will:
     - Install Python dependencies
     - Install Node.js dependencies
     - Build the React frontend
     - Start the Flask server with Gunicorn

## How it works

- `nixpacks.toml`: Defines the build process (install deps, build frontend)
- `Procfile`: Tells Railway how to start the server
- `railway.toml`: Additional Railway configuration
- Server runs on port defined by `$PORT` environment variable
- Frontend is built and served as static files from `/server/app.py`
- All API routes are under `/api/`
- Frontend routes are handled by React Router

## Local Development

Backend:
```bash
cd server
python -m flask run
```

Frontend:
```bash
cd client
npm run dev
```

## Production URL

Your app will be available at: `https://your-app.up.railway.app`
