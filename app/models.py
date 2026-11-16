from app.database import db


class Company(db.Model):
    __tablename__ = "company"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    city = db.Column(db.String(160), default="")
    nif = db.Column(db.String(80), default="")
    rccm = db.Column(db.String(80), default="")
    tel = db.Column(db.String(40), default="")
    mail = db.Column(db.String(120), default="")
    tva = db.Column(db.Float, default=0.18)
    exercice = db.Column(db.String(8), default="2026")
    cloture = db.Column(db.Boolean, default=False)


class Sequence(db.Model):
    __tablename__ = "sequences"

    key = db.Column(db.String(20), primary_key=True)
    value = db.Column(db.Integer, nullable=False, default=0)


class Account(db.Model):
    __tablename__ = "accounts"

    code = db.Column(db.String(16), primary_key=True)
    label = db.Column(db.String(160), nullable=False)


class JournalType(db.Model):
    __tablename__ = "journal_types"

    code = db.Column(db.String(8), primary_key=True)
    label = db.Column(db.String(80), nullable=False)


class Party(db.Model):
    __tablename__ = "parties"

    id = db.Column(db.Integer, primary_key=True)
    kind = db.Column(db.String(1), nullable=False)  # C client, F fournisseur
    name = db.Column(db.String(160), nullable=False, unique=True)
    phone = db.Column(db.String(40), default="")
    email = db.Column(db.String(120), default="")
    city = db.Column(db.String(120), default="")


class Article(db.Model):
    __tablename__ = "articles"

    ref = db.Column(db.String(32), primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    price = db.Column(db.Float, default=0)
    qty = db.Column(db.Float, default=0)
    mini = db.Column(db.Float, default=0)
    family = db.Column(db.String(80), default="Divers")


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.String(32), primary_key=True)
    type = db.Column(db.String(40), nullable=False)
    party = db.Column(db.String(160), nullable=False)
    date = db.Column(db.String(10), nullable=False)
    ht = db.Column(db.Float, default=0)
    tva = db.Column(db.Float, default=0)
    total = db.Column(db.Float, default=0)
    status = db.Column(db.String(40), default="")
    rev_account = db.Column(db.String(16), default="701")
    chg_account = db.Column(db.String(16), default="601")
    article = db.Column(db.String(160), default="")
    qty = db.Column(db.Float, default=0)
    unit_price = db.Column(db.Float, default=0)


class JournalLine(db.Model):
    __tablename__ = "journal_lines"

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(10), nullable=False)
    journal = db.Column(db.String(8), nullable=False)
    piece = db.Column(db.String(40), nullable=False)
    label = db.Column(db.String(240), default="")
    account = db.Column(db.String(16), nullable=False)
    debit = db.Column(db.Float, default=0)
    credit = db.Column(db.Float, default=0)


class Vehicle(db.Model):
    __tablename__ = "vehicles"

    id = db.Column(db.String(16), primary_key=True)
    plate = db.Column(db.String(32), default="")
    model = db.Column(db.String(80), default="")
    driver = db.Column(db.String(80), default="")
    km = db.Column(db.Integer, default=0)
    status = db.Column(db.String(32), default="Disponible")
    insurance = db.Column(db.String(10), default="")
    tech_control = db.Column(db.String(10), default="")


class Mission(db.Model):
    __tablename__ = "missions"

    id = db.Column(db.String(16), primary_key=True)
    origin = db.Column(db.String(80), default="")
    destination = db.Column(db.String(80), default="")
    vehicle_id = db.Column(db.String(16), db.ForeignKey("vehicles.id"))
    client = db.Column(db.String(160), default="")
    progress = db.Column(db.Integer, default=0)
    cost = db.Column(db.Float, default=0)
    revenue = db.Column(db.Float, default=0)


class Asset(db.Model):
    __tablename__ = "assets"

    id = db.Column(db.String(16), primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    service_date = db.Column(db.String(10), nullable=False)
    cost = db.Column(db.Float, default=0)
    duration = db.Column(db.Integer, default=5)
    account = db.Column(db.String(16), default="244")


class Employee(db.Model):
    __tablename__ = "employees"

    id = db.Column(db.String(16), primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    position = db.Column(db.String(120), default="")
    salary = db.Column(db.Float, default=0)
    start_date = db.Column(db.String(10), default="")


class Payslip(db.Model):
    __tablename__ = "payslips"

    id = db.Column(db.String(24), primary_key=True)
    period = db.Column(db.String(7), nullable=False)
    total = db.Column(db.Float, default=0)
    status = db.Column(db.String(40), default="Comptabilisé")


class AppState(db.Model):
    __tablename__ = "app_state"

    id = db.Column(db.Integer, primary_key=True)
    payload = db.Column(db.Text, nullable=False)
    updated_at = db.Column(db.Float, default=0)


class AppUser(db.Model):
    __tablename__ = "app_users"

    id = db.Column(db.String(32), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(32), nullable=False)
    pin_hash = db.Column(db.String(255), nullable=False)
    totp_secret = db.Column(db.String(64), default="")
    totp_enabled = db.Column(db.Boolean, default=False)
    pending_secret = db.Column(db.String(64), default="")
    failed = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.Float, default=0)


class NotifyConfig(db.Model):
    __tablename__ = "notify_config"

    id = db.Column(db.Integer, primary_key=True)
    twilio_sid = db.Column(db.String(64), default="")
    twilio_token = db.Column(db.String(128), default="")
    twilio_sms_from = db.Column(db.String(40), default="")
    twilio_wa_from = db.Column(db.String(40), default="")
    smtp_host = db.Column(db.String(120), default="")
    smtp_port = db.Column(db.Integer, default=587)
    smtp_user = db.Column(db.String(120), default="")
    smtp_pass = db.Column(db.String(128), default="")
    smtp_from = db.Column(db.String(120), default="")
