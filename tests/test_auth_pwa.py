"""PIN, 2FA, relances et service worker."""
import pyotp
from werkzeug.security import generate_password_hash

from app import create_app
from app.database import db
from app.models import AppUser
from app.notify import e164, wa_link


def test_e164_guinee():
    assert e164("+224 614 99 85 86") == "+224614998586"
    assert e164("224614998586") == "+224614998586"
    assert "wa.me/224614998586" in wa_link("+224 614 99 85 86", "Bonjour")


def test_login_pin():
    app = create_app()
    with app.test_client() as c:
        bad = c.post("/api/auth/login", json={"id": "comptable", "pin": "0000"})
        assert bad.status_code == 401
        ok = c.post("/api/auth/login", json={"id": "comptable", "pin": "1234"})
        assert ok.status_code == 200
        body = ok.get_json()
        assert body["ok"] is True
        assert body["need_2fa"] is False
        me = c.get("/api/auth/me")
        assert me.status_code == 200
        assert me.get_json()["id"] == "comptable"


def test_totp_flow():
    app = create_app()
    with app.app_context():
        u = db.session.get(AppUser, "test2fa")
        if not u:
            u = AppUser(
                id="test2fa",
                name="Test 2FA",
                role="commercial",
                pin_hash=generate_password_hash("1234"),
            )
            db.session.add(u)
            db.session.commit()
        else:
            u.totp_enabled = False
            u.totp_secret = ""
            u.pending_secret = ""
            u.failed = 0
            u.locked_until = 0
            db.session.commit()
    with app.test_client() as c:
        c.post("/api/auth/login", json={"id": "test2fa", "pin": "1234"})
        setup = c.post("/api/auth/setup-2fa")
        assert setup.status_code == 200
        secret = setup.get_json()["secret"]
        code = pyotp.TOTP(secret).now()
        confirm = c.post("/api/auth/confirm-2fa", json={"code": code})
        assert confirm.get_json()["ok"] is True
        c.post("/api/auth/logout")
        again = c.post("/api/auth/login", json={"id": "test2fa", "pin": "1234"})
        body = again.get_json()
        assert body["need_2fa"] is True
        otp = pyotp.TOTP(secret).now()
        ver = c.post("/api/auth/verify-2fa", json={"ticket": body["ticket"], "code": otp})
        assert ver.status_code == 200
        c.post("/api/auth/disable-2fa", json={"pin": "1234", "code": pyotp.TOTP(secret).now()})


def test_remind_whatsapp_ouvre_lapp():
    app = create_app()
    with app.test_client() as c:
        denied = c.post("/api/remind", json={"channel": "whatsapp", "to": "+224614998586", "message": "Test"})
        assert denied.status_code == 401
        c.post("/api/auth/login", json={"id": "direction", "pin": "1234"})
        sent = c.post(
            "/api/remind",
            json={"channel": "whatsapp", "to": "+224 614 99 85 86", "message": "Facture due 1 000 000 GNF"},
        )
        body = sent.get_json()
        assert body["ok"] is True
        assert "wa.me/224614998586" in body["open"]
        sms = c.post("/api/remind", json={"channel": "sms", "to": "622001122", "message": "Relance Fastlane"})
        assert sms.get_json()["ok"] is True
        assert sms.get_json()["open"].startswith("sms:")


def test_service_worker_scope():
    app = create_app()
    with app.test_client() as c:
        r = c.get("/sw.js")
        assert r.status_code == 200
        assert r.headers.get("Service-Worker-Allowed") == "/"
        text = r.get_data(as_text=True)
        assert "fl-shell-" in text
        man = c.get("/static/manifest.webmanifest")
        assert man.status_code == 200
        assert man.get_json()["short_name"] == "Fastlane"
