import json
import time

from app.database import db
from app.models import (
    Account,
    AppState,
    Article,
    Asset,
    Company,
    Document,
    Employee,
    JournalLine,
    JournalType,
    Mission,
    Party,
    Payslip,
    Sequence,
    Vehicle,
)

PLAN = {
    "101": "Capital social",
    "106": "Réserves",
    "120": "Résultat net",
    "211": "Terrains",
    "213": "Constructions",
    "244": "Matériel de transport",
    "245": "Matériel de bureau",
    "281": "Amortissements immobilisations",
    "31": "Marchandises",
    "401": "Fournisseurs",
    "408": "Fournisseurs factures non parvenues",
    "411": "Clients",
    "421": "Personnel — rémunérations dues",
    "431": "Sécurité sociale",
    "4431": "État, TVA facturée",
    "4452": "État, TVA récupérable",
    "521": "Banques",
    "571": "Caisse",
    "585": "Monnaie électronique",
    "601": "Achats de marchandises",
    "604": "Matières et fournitures",
    "605": "Autres achats",
    "613": "Locations",
    "622": "Entretien et réparations",
    "624": "Transports",
    "661": "Rémunérations du personnel",
    "664": "Charges sociales",
    "681": "Dotations aux amortissements",
    "701": "Ventes de marchandises",
    "706": "Services vendus",
    "707": "Produits accessoires",
    "718": "Transferts de charges",
}

JOURNALS = {
    "VT": "Ventes",
    "AC": "Achats",
    "BQ": "Banque",
    "CA": "Caisse",
    "OD": "Opérations diverses",
    "PA": "Paie",
    "IM": "Immobilisations",
    "ST": "Stocks",
}


def empty_state() -> dict:
    return {
        "seq": {"doc": 0, "j": 0, "im": 0, "pa": 0, "mis": 0},
        "co": {
            "name": "Fastlane Logistic SARL",
            "city": "",
            "nif": "",
            "rccm": "",
            "tel": "",
            "mail": "",
            "tva": 0.18,
            "ex": "2026",
            "cloture": False,
        },
        "cl": [],
        "fr": [],
        "art": [],
        "docs": [],
        "j": [],
        "veh": [],
        "mis": [],
        "immo": [],
        "emp": [],
        "pay": [],
        "lettrage": [],
        "plan": PLAN,
        "journals": JOURNALS,
    }


def db_to_state() -> dict:
    S = empty_state()
    co = Company.query.first()
    if co:
        S["co"] = {
            "name": co.name,
            "city": co.city,
            "nif": co.nif,
            "rccm": co.rccm,
            "tel": co.tel,
            "mail": co.mail,
            "tva": co.tva,
            "ex": co.exercice,
            "cloture": bool(co.cloture),
        }
    for row in Sequence.query.all():
        S["seq"][row.key] = row.value
    S["cl"] = [p.name for p in Party.query.filter_by(kind="C").order_by(Party.id)]
    S["fr"] = [p.name for p in Party.query.filter_by(kind="F").order_by(Party.id)]
    S["art"] = [
        {"r": a.ref, "n": a.name, "p": a.price, "q": a.qty, "m": a.mini, "c": a.family}
        for a in Article.query.order_by(Article.ref)
    ]
    S["docs"] = [
        {
            "id": d.id,
            "type": d.type,
            "cl": d.party,
            "d": d.date,
            "ht": d.ht,
            "tva": d.tva,
            "total": d.total,
            "st": d.status,
            "rev": d.rev_account,
            "chg": d.chg_account,
            "art": d.article,
            "qty": d.qty,
            "pu": d.unit_price,
        }
        for d in Document.query.order_by(Document.date, Document.id)
    ]
    S["j"] = [
        {
            "d": l.date,
            "j": l.journal,
            "p": l.piece,
            "l": l.label,
            "c": l.account,
            "db": l.debit,
            "cr": l.credit,
        }
        for l in JournalLine.query.order_by(JournalLine.id)
    ]
    S["veh"] = [
        {
            "id": v.id,
            "pl": v.plate,
            "mo": v.model,
            "dr": v.driver,
            "km": v.km,
            "st": v.status,
            "ins": v.insurance,
            "ct": v.tech_control,
        }
        for v in Vehicle.query.order_by(Vehicle.id)
    ]
    S["mis"] = [
        {
            "id": m.id,
            "a": m.origin,
            "b": m.destination,
            "v": m.vehicle_id,
            "c": m.client,
            "p": m.progress,
            "cost": m.cost,
            "rev": m.revenue,
        }
        for m in Mission.query.order_by(Mission.id)
    ]
    S["immo"] = [
        {"id": a.id, "n": a.name, "d": a.service_date, "c": a.cost, "dur": a.duration, "acc": a.account}
        for a in Asset.query.order_by(Asset.id)
    ]
    S["emp"] = [
        {"id": e.id, "n": e.name, "p": e.position, "s": e.salary, "d": e.start_date}
        for e in Employee.query.order_by(Employee.id)
    ]
    S["pay"] = [
        {"id": p.id, "m": p.period, "tot": p.total, "st": p.status}
        for p in Payslip.query.order_by(Payslip.id)
    ]
    plan = {a.code: a.label for a in Account.query.all()}
    if plan:
        S["plan"] = plan
    journals = {j.code: j.label for j in JournalType.query.all()}
    if journals:
        S["journals"] = journals
    return S


def _clear() -> None:
    for model in (
        Mission,
        JournalLine,
        Document,
        Payslip,
        Article,
        Party,
        Vehicle,
        Asset,
        Employee,
        Sequence,
        Company,
        Account,
        JournalType,
    ):
        db.session.query(model).delete()
        db.session.flush()


def state_to_db(S: dict) -> None:
    _clear()
    co = S.get("co") or {}
    db.session.add(
        Company(
            name=co.get("name") or "Fastlane Logistic SARL",
            city=co.get("city") or "",
            nif=co.get("nif") or "",
            rccm=co.get("rccm") or "",
            tel=co.get("tel") or "",
            mail=co.get("mail") or "",
            tva=float(co.get("tva") or 0.18),
            exercice=str(co.get("ex") or "2026"),
            cloture=bool(co.get("cloture")),
        )
    )
    for key, value in (S.get("seq") or {}).items():
        db.session.add(Sequence(key=key, value=int(value or 0)))
    def _party_name(x):
        if isinstance(x, dict):
            return x.get("n") or ""
        return str(x or "")

    for name in S.get("cl") or []:
        db.session.add(Party(kind="C", name=_party_name(name)))
    for name in S.get("fr") or []:
        db.session.add(Party(kind="F", name=_party_name(name)))
    for a in S.get("art") or []:
        db.session.add(
            Article(
                ref=a.get("r"),
                name=a.get("n") or "",
                price=float(a.get("p") or 0),
                qty=float(a.get("q") or 0),
                mini=float(a.get("m") or 0),
                family=a.get("c") or "Divers",
            )
        )
    for d in S.get("docs") or []:
        db.session.add(
            Document(
                id=d.get("id"),
                type=d.get("type") or "",
                party=d.get("cl") or "",
                date=d.get("d") or "",
                ht=float(d.get("ht") or 0),
                tva=float(d.get("tva") or 0),
                total=float(d.get("total") or 0),
                status=d.get("st") or "",
                rev_account=d.get("rev") or "701",
                chg_account=d.get("chg") or "601",
                article=d.get("art") or "",
                qty=float(d.get("qty") or 0),
                unit_price=float(d.get("pu") or 0),
            )
        )
    for l in S.get("j") or []:
        db.session.add(
            JournalLine(
                date=l.get("d") or "",
                journal=l.get("j") or "OD",
                piece=l.get("p") or "",
                label=l.get("l") or "",
                account=str(l.get("c") or ""),
                debit=float(l.get("db") or 0),
                credit=float(l.get("cr") or 0),
            )
        )
    for v in S.get("veh") or []:
        db.session.add(
            Vehicle(
                id=v.get("id"),
                plate=v.get("pl") or "",
                model=v.get("mo") or "",
                driver=v.get("dr") or "",
                km=int(v.get("km") or 0),
                status=v.get("st") or "Disponible",
                insurance=v.get("ins") or "",
                tech_control=v.get("ct") or "",
            )
        )
    db.session.flush()
    for m in S.get("mis") or []:
        db.session.add(
            Mission(
                id=m.get("id"),
                origin=m.get("a") or "",
                destination=m.get("b") or "",
                vehicle_id=m.get("v"),
                client=m.get("c") or "",
                progress=int(m.get("p") or 0),
                cost=float(m.get("cost") or 0),
                revenue=float(m.get("rev") or 0),
            )
        )
    for a in S.get("immo") or []:
        db.session.add(
            Asset(
                id=a.get("id"),
                name=a.get("n") or "",
                service_date=a.get("d") or "",
                cost=float(a.get("c") or 0),
                duration=int(a.get("dur") or 5),
                account=a.get("acc") or "244",
            )
        )
    for e in S.get("emp") or []:
        db.session.add(
            Employee(
                id=e.get("id"),
                name=e.get("n") or "",
                position=e.get("p") or "",
                salary=float(e.get("s") or 0),
                start_date=e.get("d") or "",
            )
        )
    for p in S.get("pay") or []:
        db.session.add(
            Payslip(
                id=p.get("id"),
                period=p.get("m") or "",
                total=float(p.get("tot") or 0),
                status=p.get("st") or "Comptabilisé",
            )
        )
    for code, label in (S.get("plan") or PLAN).items():
        db.session.add(Account(code=code, label=label))
    for code, label in (S.get("journals") or JOURNALS).items():
        db.session.add(JournalType(code=code, label=label))
    db.session.commit()
    save_fast(S, commit=False)
    db.session.commit()


def save_fast(S: dict, commit: bool = True) -> None:
    blob = json.dumps(S, ensure_ascii=False, separators=(",", ":"))
    row = db.session.get(AppState, 1)
    if row:
        row.payload = blob
        row.updated_at = time.time()
    else:
        db.session.add(AppState(id=1, payload=blob, updated_at=time.time()))
    if commit:
        db.session.commit()


def load_fast() -> dict:
    row = db.session.get(AppState, 1)
    if row and row.payload:
        try:
            data = json.loads(row.payload)
            if data.get("co"):
                return data
        except json.JSONDecodeError:
            pass
    S = db_to_state()
    save_fast(S)
    return S
