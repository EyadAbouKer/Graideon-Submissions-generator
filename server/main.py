import os
from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy.orm import DeclarativeBase
from datetime import timedelta


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)

# Serve static files from client/dist in production
static_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'client', 'dist')
if os.path.exists(static_folder):
    app = Flask(__name__, static_folder=static_folder, static_url_path='')
else:
    app = Flask(__name__)

allowed_origins = ["http://localhost:5000", "http://127.0.0.1:5000"]
if os.environ.get("REPLIT_DEV_DOMAIN"):
    allowed_origins.append(f"https://{os.environ.get('REPLIT_DEV_DOMAIN')}")
if os.environ.get("REPLIT_DOMAINS"):
    for domain in os.environ.get("REPLIT_DOMAINS", "").split(","):
        if domain.strip():
            allowed_origins.append(f"https://{domain.strip()}")
# Add Railway domain support
if os.environ.get("RAILWAY_PUBLIC_DOMAIN"):
    allowed_origins.append(f"https://{os.environ.get('RAILWAY_PUBLIC_DOMAIN')}")

CORS(app, supports_credentials=True, origins=[o for o in allowed_origins if o])

session_secret = os.environ.get("SESSION_SECRET")
if not session_secret:
    raise ValueError("SESSION_SECRET environment variable is required for secure sessions")
app.secret_key = session_secret
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = True
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

db.init_app(app)

with app.app_context():
    import models  # noqa: F401
    db.create_all()
