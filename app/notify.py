"""Relances SMS, WhatsApp et e-mail (Twilio / SMTP, sinon ouverture de l’app réelle)."""
from __future__ import annotations

import json
import re
import smtplib
from base64 import b64encode
from email.message import EmailMessage
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from app.database import db
from app.models import NotifyConfig


def get_config() -> NotifyConfig:
    row = db.session.get(NotifyConfig, 1)
    if not row:
        row = NotifyConfig(id=1)
        db.session.add(row)
        db.session.commit()
    return row


def status() -> dict:
    c = get_config()
    return {
        "sms": bool(c.twilio_sid and c.twilio_token and c.twilio_sms_from),
        "whatsapp": bool(c.twilio_sid and c.twilio_token and c.twilio_wa_from),
        "email": bool(c.smtp_host and c.smtp_from),
    }


def e164(raw: str) -> str:
    d = re.sub(r"\D", "", raw or "")
    if d.startswith("00"):
        d = d[2:]
    if d.startswith("224"):
        return "+" + d
    if len(d) in (8, 9):
        return "+224" + d
    return "+" + d if d else ""


def digits(raw: str) -> str:
    return re.sub(r"\D", "", e164(raw) or raw or "")


def wa_link(phone: str, text: str) -> str:
    return f"https://wa.me/{digits(phone)}?text={quote(text)}"


def sms_link(phone: str, text: str) -> str:
    n = e164(phone)
    return f"sms:{n}?&body={quote(text)}"


def mailto_link(addr: str, subject: str, text: str) -> str:
    return f"mailto:{addr}?subject={quote(subject)}&body={quote(text)}"


def _twilio(c: NotifyConfig, to: str, body: str, whatsapp: bool) -> dict:
    sid, token = c.twilio_sid.strip(), c.twilio_token.strip()
    frm = (c.twilio_wa_from if whatsapp else c.twilio_sms_from).strip()
    to_n = e164(to)
    if whatsapp:
        if not frm.startswith("whatsapp:"):
            frm = "whatsapp:" + e164(frm)
        to_n = "whatsapp:" + to_n
    url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
    data = urlencode({"From": frm, "To": to_n, "Body": body}).encode()
    req = Request(url, data=data, method="POST")
    req.add_header("Authorization", "Basic " + b64encode(f"{sid}:{token}".encode()).decode())
    try:
        with urlopen(req, timeout=20) as resp:
            payload = json.loads(resp.read().decode())
        return {"ok": True, "mode": "api", "sid": payload.get("sid")}
    except HTTPError as e:
        detail = e.read().decode()[:300]
        return {"ok": False, "error": f"Twilio {e.code}: {detail}"}
    except URLError as e:
        return {"ok": False, "error": str(e.reason)}


def _smtp(c: NotifyConfig, to: str, subject: str, body: str) -> dict:
    msg = EmailMessage()
    msg["From"] = c.smtp_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    try:
        with smtplib.SMTP(c.smtp_host, int(c.smtp_port or 587), timeout=20) as s:
            s.starttls()
            if c.smtp_user:
                s.login(c.smtp_user, c.smtp_pass or "")
            s.send_message(msg)
        return {"ok": True, "mode": "api"}
    except Exception as e:  # noqa: BLE001 — renvoyé à l’UI
        return {"ok": False, "error": str(e)}


def send(channel: str, to: str, message: str, subject: str = "") -> dict:
    c = get_config()
    st = status()
    channel = (channel or "").lower()
    if channel == "whatsapp":
        if st["whatsapp"]:
            r = _twilio(c, to, message, True)
            if r.get("ok"):
                return r
            r["open"] = wa_link(to, message)
            r["mode"] = "app"
            return {**r, "ok": True, "fallback": r.get("error")}
        return {"ok": True, "mode": "app", "open": wa_link(to, message)}
    if channel == "sms":
        if st["sms"]:
            r = _twilio(c, to, message, False)
            if r.get("ok"):
                return r
            r["open"] = sms_link(to, message)
            r["mode"] = "app"
            return {**r, "ok": True, "fallback": r.get("error")}
        return {"ok": True, "mode": "app", "open": sms_link(to, message)}
    if channel == "email":
        sub = subject or "Relance Fastlane Gestion"
        if st["email"]:
            r = _smtp(c, to, sub, message)
            if r.get("ok"):
                return r
            r["open"] = mailto_link(to, sub, message)
            r["mode"] = "app"
            return {**r, "ok": True, "fallback": r.get("error")}
        return {"ok": True, "mode": "app", "open": mailto_link(to, sub, message)}
    return {"ok": False, "error": "Canal inconnu"}
