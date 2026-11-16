"""PIN, TOTP, sessions et utilisateurs démo."""
from __future__ import annotations

import time

import pyotp
from flask import session
from werkzeug.security import check_password_hash, generate_password_hash

from app.database import db
from app.models import AppUser

DEMO_PIN = "1234"
MAX_FAIL = 5
LOCK_SEC = 15 * 60

DEMO_USERS = [
    ("direction", "Aminata Touré", "direction"),
    ("comptable", "Aïssatou Diallo", "comptable"),
    ("commercial", "Alpha Baldé", "commercial"),
    ("magasinier", "Fatoumata Camara", "magasinier"),
    ("caissier", "Mamadou Sylla", "caissier"),
    ("flotte", "Ibrahima Sow", "flotte"),
    ("chauffeur", "Mamadou Barry", "chauffeur"),
]


def seed_users() -> None:
    if AppUser.query.first():
        return
    pin_hash = generate_password_hash(DEMO_PIN)
    for uid, name, role in DEMO_USERS:
        db.session.add(AppUser(id=uid, name=name, role=role, pin_hash=pin_hash))
    db.session.commit()


def public_users() -> list[dict]:
    seed_users()
    return [
        {"id": u.id, "n": u.name, "r": u.role, "totp": bool(u.totp_enabled)}
        for u in AppUser.query.order_by(AppUser.id)
        if not u.id.startswith("test")
    ]


def current_user() -> AppUser | None:
    uid = session.get("uid")
    if not uid:
        return None
    return db.session.get(AppUser, uid)


def user_public(u: AppUser) -> dict:
    return {"id": u.id, "n": u.name, "r": u.role, "totp": bool(u.totp_enabled)}


def is_locked(u: AppUser) -> float:
    now = time.time()
    if u.locked_until and u.locked_until > now:
        return u.locked_until - now
    return 0


def register_fail(u: AppUser) -> None:
    u.failed = (u.failed or 0) + 1
    if u.failed >= MAX_FAIL:
        u.locked_until = time.time() + LOCK_SEC
        u.failed = 0
    db.session.commit()


def register_ok(u: AppUser) -> None:
    u.failed = 0
    u.locked_until = 0
    db.session.commit()


def check_pin(u: AppUser, pin: str) -> bool:
    if not pin or not u.pin_hash:
        return False
    return check_password_hash(u.pin_hash, pin.strip())


def check_totp(secret: str, code: str) -> bool:
    if not secret or not code:
        return False
    totp = pyotp.TOTP(secret)
    return bool(totp.verify(code.strip().replace(" ", ""), valid_window=1))


def new_secret() -> str:
    return pyotp.random_base32()


def otpauth(secret: str, user_id: str) -> str:
    return pyotp.TOTP(secret).provisioning_uri(name=f"{user_id}@fastlane", issuer_name="Fastlane Gestion")
