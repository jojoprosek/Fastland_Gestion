import os
from datetime import timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)


def _secret_key() -> str:
    env = os.environ.get("FASTLANE_SECRET")
    if env:
        return env
    path = DATA_DIR / "secret.key"
    if not path.exists():
        path.write_text(os.urandom(32).hex(), encoding="utf-8")
    return path.read_text(encoding="utf-8").strip()


class Config:
    SECRET_KEY = _secret_key()
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{DATA_DIR / 'logigest.db'}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    PERMANENT_SESSION_LIFETIME = timedelta(hours=12)
