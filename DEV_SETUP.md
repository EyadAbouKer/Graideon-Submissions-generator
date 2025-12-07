# Development Setup Instructions

## Running the Application in Development Mode

In development, you need to run **both** the backend and frontend servers separately.

### Step 1: Start the Backend Server

Open a terminal and run:

```bash
cd server
python main.py
```

**IMPORTANT:** Use `python main.py` (not `python -m flask run`) to ensure Flask runs on port 8000.

Alternatively, you can use Flask CLI with the port specified:

```bash
cd server
set FLASK_APP=main.py
python -m flask run --port=8000
```

The backend will run on **http://localhost:8000**

**Note:** Make sure you have the required environment variables set:
- `SESSION_SECRET` - A secret key for Flask sessions
- `DATABASE_URL` - Your database connection string
- `GOOGLE_API_KEY` - Your Google API key for Gemini
- `ADMIN_EMAIL` - Admin email (default: devops@graideon.com)
- `ADMIN_PASSWORD_HASH` - SHA256 hash of admin password

### Step 2: Start the Frontend Development Server

Open a **second terminal** and run:

```bash
cd client
npm install  # Only needed the first time or after adding dependencies
npm run dev
```

The frontend will run on **http://localhost:5000**

### Step 3: Access the Application

Open your browser and go to:
**http://localhost:5000**

The Vite dev server automatically proxies all `/api/*` requests to the backend at `http://localhost:8000`.

## Important Notes

- **Do NOT** access the Flask server directly at `http://localhost:8000` - you'll get the "Frontend not built" error
- Always access the app via the frontend dev server at `http://localhost:5000`
- The frontend dev server handles hot-reloading and development features
- In production, the frontend is built and served by Flask, but in development they run separately

## Troubleshooting

### Port Conflict Issue

**Problem:** You see `{"error":"Frontend not built"}` when accessing `http://localhost:5000` after starting the backend.

**Cause:** The backend is running on port 5000 (Flask default) instead of port 8000, which conflicts with the frontend Vite dev server.

**Solution:**
1. Stop the backend server (Ctrl+C)
2. Make sure you're running it with `python main.py` (not `python -m flask run` without port specification)
3. Verify the backend is running on port 8000 by checking the terminal output - it should say "Running on http://0.0.0.0:8000"
4. If using `python -m flask run`, always add `--port=8000` flag

### Other Issues

If you see `{"error":"Frontend not built"}`:
- Make sure you're accessing `http://localhost:5000` (frontend), not `http://localhost:8000` (backend)
- Ensure both servers are running
- Check that the frontend dev server is proxying API requests correctly
- Verify backend is on port 8000, frontend is on port 5000

