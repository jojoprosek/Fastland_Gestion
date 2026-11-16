import time

from flask import Blueprint, current_app, jsonify, render_template, request, send_from_directory, session
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.database import db
from app.models import (
    Account,
    AppUser,
    Article,
    Asset,
    Company,
    Document,
    Employee,
    JournalLine,
    Mission,
    Party,
    Payslip,
    Vehicle,
)
from app import notify as notify_mod
from app.security import (
    check_pin,
    check_totp,
    current_user,
    is_locked,
    new_secret,
    otpauth,
    public_users,
    register_fail,
    register_ok,
    seed_users,
    user_public,
)
from app.seed import reset_database
from app.serialize import load_fast, save_fast

bp = Blueprint("main", __name__)


def _signer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="fl-2fa")


def _require_user():
    u = current_user()
    if not u:
        return None, (jsonify({"ok": False, "error": "Non authentifié"}), 401)
    return u, None


@bp.get("/")
def index():
    return render_template("index.html")


@bp.get("/sw.js")
def service_worker():
    resp = send_from_directory(current_app.static_folder, "sw.js", mimetype="application/javascript")
    resp.headers["Service-Worker-Allowed"] = "/"
    resp.headers["Cache-Control"] = "no-cache"
    return resp


@bp.get("/api/auth/users")
def auth_users():
    seed_users()
    return jsonify({"users": public_users()})


@bp.get("/api/auth/me")
def auth_me():
    u = current_user()
    if not u:
        return jsonify({"ok": False}), 401
    return jsonify({"ok": True, **user_public(u)})


@bp.post("/api/auth/login")
def auth_login():
    seed_users()
    data = request.get_json(force=True, silent=True) or {}
    uid = (data.get("id") or "").strip()
    pin = str(data.get("pin") or "")
    u = db.session.get(AppUser, uid)
    if not u:
        return jsonify({"ok": False, "error": "Profil introuvable"}), 404
    wait = is_locked(u)
    if wait:
        return jsonify({"ok": False, "error": f"Compte bloqué {int(wait // 60) + 1} min", "locked": int(wait)}), 423
    if not check_pin(u, pin):
        register_fail(u)
        left = max(0, 5 - (u.failed or 0))
        wait = is_locked(u)
        if wait:
            return jsonify({"ok": False, "error": "Compte bloqué 15 min après 5 essais", "locked": int(wait)}), 423
        return jsonify({"ok": False, "error": f"PIN incorrect — {left} essai(s) restant(s)"}), 401
    if u.totp_enabled:
        ticket = _signer().dumps({"uid": u.id, "t": time.time()})
        return jsonify({"ok": True, "need_2fa": True, "ticket": ticket, "n": u.name})
    register_ok(u)
    session.permanent = True
    session["uid"] = u.id
    session["role"] = u.role
    return jsonify({"ok": True, "need_2fa": False, **user_public(u)})


@bp.post("/api/auth/verify-2fa")
def auth_verify_2fa():
    data = request.get_json(force=True, silent=True) or {}
    try:
        payload = _signer().loads(data.get("ticket") or "", max_age=300)
    except SignatureExpired:
        return jsonify({"ok": False, "error": "Code expiré — reconnectez-vous"}), 401
    except BadSignature:
        return jsonify({"ok": False, "error": "Session 2FA invalide"}), 401
    u = db.session.get(AppUser, payload.get("uid"))
    if not u:
        return jsonify({"ok": False, "error": "Profil introuvable"}), 404
    wait = is_locked(u)
    if wait:
        return jsonify({"ok": False, "error": f"Compte bloqué {int(wait // 60) + 1} min"}), 423
    if not check_totp(u.totp_secret, str(data.get("code") or "")):
        register_fail(u)
        return jsonify({"ok": False, "error": "Code 2FA incorrect"}), 401
    register_ok(u)
    session.permanent = True
    session["uid"] = u.id
    session["role"] = u.role
    return jsonify({"ok": True, **user_public(u)})


@bp.post("/api/auth/logout")
def auth_logout():
    session.clear()
    return jsonify({"ok": True})


@bp.post("/api/auth/setup-2fa")
def auth_setup_2fa():
    u, err = _require_user()
    if err:
        return err
    secret = new_secret()
    u.pending_secret = secret
    db.session.commit()
    uri = otpauth(secret, u.id)
    return jsonify({"ok": True, "secret": secret, "otpauth": uri})


@bp.post("/api/auth/confirm-2fa")
def auth_confirm_2fa():
    u, err = _require_user()
    if err:
        return err
    data = request.get_json(force=True, silent=True) or {}
    secret = u.pending_secret or u.totp_secret
    if not check_totp(secret, str(data.get("code") or "")):
        return jsonify({"ok": False, "error": "Code invalide — réessayez"}), 401
    u.totp_secret = secret
    u.totp_enabled = True
    u.pending_secret = ""
    db.session.commit()
    return jsonify({"ok": True, **user_public(u)})


@bp.post("/api/auth/disable-2fa")
def auth_disable_2fa():
    u, err = _require_user()
    if err:
        return err
    data = request.get_json(force=True, silent=True) or {}
    if not check_pin(u, str(data.get("pin") or "")):
        return jsonify({"ok": False, "error": "PIN incorrect"}), 401
    if u.totp_enabled and not check_totp(u.totp_secret, str(data.get("code") or "")):
        return jsonify({"ok": False, "error": "Code 2FA incorrect"}), 401
    u.totp_enabled = False
    u.totp_secret = ""
    u.pending_secret = ""
    db.session.commit()
    return jsonify({"ok": True, **user_public(u)})


@bp.get("/api/notify/status")
def notify_status():
    return jsonify(notify_mod.status())


@bp.post("/api/notify/config")
def notify_config():
    u, err = _require_user()
    if err:
        return err
    if u.role not in ("direction", "comptable"):
        return jsonify({"ok": False, "error": "Droit insuffisant"}), 403
    data = request.get_json(force=True, silent=True) or {}
    c = notify_mod.get_config()
    for field in (
        "twilio_sid",
        "twilio_token",
        "twilio_sms_from",
        "twilio_wa_from",
        "smtp_host",
        "smtp_user",
        "smtp_pass",
        "smtp_from",
    ):
        if field in data and data[field] not in (None, ""):
            setattr(c, field, str(data[field]).strip())
        elif field in data and data[field] == "":
            setattr(c, field, "")
    if "smtp_port" in data:
        try:
            c.smtp_port = int(data["smtp_port"] or 587)
        except ValueError:
            c.smtp_port = 587
    db.session.commit()
    return jsonify({"ok": True, **notify_mod.status()})


@bp.post("/api/remind")
def remind():
    u, err = _require_user()
    if err:
        return err
    data = request.get_json(force=True, silent=True) or {}
    channel = (data.get("channel") or "").lower()
    to = (data.get("to") or "").strip()
    message = (data.get("message") or "").strip()
    if not to or not message:
        return jsonify({"ok": False, "error": "Destinataire et message requis"}), 400
    result = notify_mod.send(channel, to, message, data.get("subject") or "")
    code = 200 if result.get("ok") else 502
    return jsonify(result), code


@bp.get("/api/health")
def health():
    return jsonify({"ok": True, "db": "sqlite", "name": "Fastlane Gestion"})


@bp.get("/api/state")
def get_state():
    return jsonify(load_fast())


@bp.put("/api/state")
def put_state():
    payload = request.get_json(force=True, silent=True) or {}
    if not payload.get("co"):
        return jsonify({"ok": False, "error": "État invalide"}), 400
    save_fast(payload)
    return jsonify({"ok": True})


@bp.post("/api/reset")
def reset():
    reset_database()
    return jsonify({"ok": True, "state": load_fast()})


@bp.get("/api/company")
def company():
    row = Company.query.first()
    if not row:
        return jsonify({}), 404
    return jsonify(
        {
            "name": row.name,
            "city": row.city,
            "nif": row.nif,
            "rccm": row.rccm,
            "tel": row.tel,
            "mail": row.mail,
            "tva": row.tva,
            "exercice": row.exercice,
        }
    )


@bp.get("/api/tiers")
def tiers():
    return jsonify([{"id": p.id, "kind": p.kind, "name": p.name} for p in Party.query.order_by(Party.kind, Party.name)])


@bp.get("/api/articles")
def articles():
    return jsonify(
        [
            {"ref": a.ref, "name": a.name, "price": a.price, "qty": a.qty, "mini": a.mini, "family": a.family}
            for a in Article.query.order_by(Article.ref)
        ]
    )


@bp.get("/api/documents")
def documents():
    return jsonify(
        [
            {
                "id": d.id,
                "type": d.type,
                "party": d.party,
                "date": d.date,
                "ht": d.ht,
                "tva": d.tva,
                "total": d.total,
                "status": d.status,
            }
            for d in Document.query.order_by(Document.date.desc())
        ]
    )


@bp.get("/api/journal")
def journal():
    return jsonify(
        [
            {
                "id": l.id,
                "date": l.date,
                "journal": l.journal,
                "piece": l.piece,
                "label": l.label,
                "account": l.account,
                "debit": l.debit,
                "credit": l.credit,
            }
            for l in JournalLine.query.order_by(JournalLine.id)
        ]
    )


@bp.get("/api/vehicles")
def vehicles():
    return jsonify(
        [
            {
                "id": v.id,
                "plate": v.plate,
                "model": v.model,
                "driver": v.driver,
                "km": v.km,
                "status": v.status,
            }
            for v in Vehicle.query.order_by(Vehicle.id)
        ]
    )


@bp.get("/api/missions")
def missions():
    return jsonify(
        [
            {
                "id": m.id,
                "origin": m.origin,
                "destination": m.destination,
                "vehicle": m.vehicle_id,
                "client": m.client,
                "progress": m.progress,
                "cost": m.cost,
                "revenue": m.revenue,
            }
            for m in Mission.query.order_by(Mission.id)
        ]
    )


@bp.get("/api/assets")
def assets():
    return jsonify(
        [
            {"id": a.id, "name": a.name, "date": a.service_date, "cost": a.cost, "duration": a.duration, "account": a.account}
            for a in Asset.query.order_by(Asset.id)
        ]
    )


@bp.get("/api/employees")
def employees():
    return jsonify(
        [
            {"id": e.id, "name": e.name, "position": e.position, "salary": e.salary, "start": e.start_date}
            for e in Employee.query.order_by(Employee.id)
        ]
    )


@bp.get("/api/payslips")
def payslips():
    return jsonify(
        [{"id": p.id, "period": p.period, "total": p.total, "status": p.status} for p in Payslip.query.order_by(Payslip.id)]
    )


@bp.get("/api/accounts")
def accounts():
    return jsonify([{"code": a.code, "label": a.label} for a in Account.query.order_by(Account.code)])
