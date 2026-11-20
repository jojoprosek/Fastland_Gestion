import os
from datetime import timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ON_VERCEL = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
_MEM_SECRET = os.urandom(32).hex()


def _data_dir() -> Path:
    preferred = Path("/tmp/fastlane-data") if ON_VERCEL else ROOT / "data"
    try:
        preferred.mkdir(parents=True, exist_ok=True)
        probe = preferred / ".write"
        probe.write_text("ok", encoding="utf-8")
        probe.unlink()
        return preferred
    except OSError:
        fallback = Path("/tmp/fastlane-data")
        fallback.mkdir(parents=True, exist_ok=True)
        return fallback


DATA_DIR = _data_dir()


def _secret_key() -> str:
    env = os.environ.get("FASTLANE_SECRET")
    if env:
        return env
    if ON_VERCEL:
        return _MEM_SECRET
    path = DATA_DIR / "secret.key"
    if not path.exists():
        path.write_text(os.urandom(32).hex(), encoding="utf-8")
    return path.read_text(encoding="utf-8").strip()


def _database_uri() -> str:
    if ON_VERCEL:
        return "sqlite:///:memory:"
    return f"sqlite:///{DATA_DIR / 'logigest.db'}"


class Config:
    SECRET_KEY = _secret_key()
    SQLALCHEMY_DATABASE_URI = _database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = ON_VERCEL
    PERMANENT_SESSION_LIFETIME = timedelta(hours=12)
