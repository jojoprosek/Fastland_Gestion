from datetime import date

from app.database import db
from app.models import Company
from app.serialize import load_fast, state_to_db

TODAY = date.today().isoformat()


def demo_state() -> dict:
    emp = [
        {"id": "E-01", "n": "Aïssatou Diallo", "p": "Responsable finance", "s": 8_500_000, "d": "2022-04-01"},
        {"id": "E-02", "n": "Mamadou Barry", "p": "Chauffeur poids lourd", "s": 4_200_000, "d": "2021-09-12"},
        {"id": "E-03", "n": "Fatoumata Camara", "p": "Gestionnaire stock", "s": 3_800_000, "d": "2023-01-20"},
        {"id": "E-04", "n": "Ibrahima Sow", "p": "Chauffeur", "s": 4_000_000, "d": "2024-02-08"},
        {"id": "E-05", "n": "Sékou Touré", "p": "Mécanicien", "s": 3_600_000, "d": "2020-11-03"},
    ]
    payroll = sum(e["s"] for e in emp)
    S = {
        "seq": {"doc": 0, "j": 0, "im": 5, "pa": 10, "mis": 103},
        "co": {
            "name": "Fastlane Logistic SARL",
            "city": "Kaloum, Conakry",
            "nif": "GN-2024-88421",
            "rccm": "GN-CKY-01-2024-B14",
            "tel": "+224 614 99 85 86",
            "mail": "finance@fastlane.gn",
            "tva": 0.18,
            "ex": "2026",
            "cloture": False,
        },
        "cl": [
            "Mining Corp Guinée",
            "SOGUIPAMI Transport",
            "Station Total Kaloum",
            "Ets Diallo et Fils",
            "Bauxite Logistics",
        ],
        "fr": ["TotalEnergies Guinée", "CFAO Equipment", "Soguiphar", "Ets Camara Pièces"],
        "art": [
            {"r": "GAS-01", "n": "Gasoil (litre)", "p": 12_500, "q": 8200, "m": 5000, "c": "Énergie"},
            {"r": "PNE-12", "n": "Pneu 12R22.5", "p": 3_200_000, "q": 6, "m": 8, "c": "Pièces"},
            {"r": "HUI-20", "n": "Huile moteur 20 L", "p": 850_000, "q": 34, "m": 15, "c": "Pièces"},
            {"r": "FIL-AIR", "n": "Filtre à air", "p": 420_000, "q": 22, "m": 10, "c": "Pièces"},
            {"r": "PLQ-FR", "n": "Plaquettes de frein", "p": 650_000, "q": 4, "m": 6, "c": "Pièces"},
            {"r": "CIM-50", "n": "Ciment 50 kg", "p": 95_000, "q": 420, "m": 200, "c": "Négoce"},
            {"r": "TRA-TN", "n": "Prestation transport / t", "p": 185_000, "q": 0, "m": 0, "c": "Service"},
            {"r": "LUB-05", "n": "Graisse 5 kg", "p": 210_000, "q": 48, "m": 20, "c": "Pièces"},
        ],
        "docs": [],
        "j": [],
        "veh": [
            {"id": "CAM-01", "pl": "RC-4521-A", "mo": "Howo 6x4", "dr": "Mamadou Barry", "km": 182340, "st": "En mission", "ins": "2027-02-14", "ct": "2026-11-20"},
            {"id": "CAM-02", "pl": "RC-1187-B", "mo": "Sinotruk A7", "dr": "Ibrahima Sow", "km": 96410, "st": "Disponible", "ins": "2026-11-12", "ct": "2027-03-02"},
            {"id": "CAM-03", "pl": "RC-7742-C", "mo": "Mercedes Actros", "dr": "Sékou Camara", "km": 245900, "st": "Maintenance", "ins": "2027-01-30", "ct": "2026-12-18"},
            {"id": "CIT-01", "pl": "RC-3320-A", "mo": "Citerne 30 000 L", "dr": "Aliou Bah", "km": 121870, "st": "En mission", "ins": "2027-04-09", "ct": "2027-05-21"},
        ],
        "mis": [
            {"id": "MIS-101", "a": "Conakry", "b": "Kankan", "v": "CAM-01", "c": "Mining Corp Guinée", "p": 62, "cost": 7.2e6, "rev": 14.5e6},
            {"id": "MIS-102", "a": "Conakry", "b": "Siguiri", "v": "CIT-01", "c": "Station Total Kaloum", "p": 35, "cost": 6.1e6, "rev": 11e6},
            {"id": "MIS-103", "a": "Kamsar", "b": "Conakry", "v": "CAM-02", "c": "Bauxite Logistics", "p": 100, "cost": 3.4e6, "rev": 8.2e6},
        ],
        "immo": [
            {"id": "IM-01", "n": "Camion Howo 6x4", "d": "2023-03-12", "c": 485e6, "dur": 5, "acc": "244"},
            {"id": "IM-02", "n": "Camion Sinotruk A7", "d": "2024-06-01", "c": 390e6, "dur": 5, "acc": "244"},
            {"id": "IM-03", "n": "Citerne 30 000 L", "d": "2022-09-18", "c": 275e6, "dur": 7, "acc": "244"},
            {"id": "IM-04", "n": "Entrepôt Kaloum", "d": "2021-01-10", "c": 820e6, "dur": 20, "acc": "213"},
            {"id": "IM-05", "n": "Serveurs et postes", "d": "2025-02-04", "c": 28e6, "dur": 3, "acc": "245"},
        ],
        "emp": emp,
        "pay": [{"id": "PA-2026-0010", "m": "2026-10", "tot": payroll, "st": "Comptabilisé"}],
        "lettrage": [],
    }

    def post(d, j, p, l, lines):
        for c, db_, cr in lines:
            S["j"].append({"d": d, "j": j, "p": p, "l": l, "c": c, "db": db_, "cr": cr})

    def nid(prefix):
        S["seq"]["doc"] += 1
        return f"{prefix}-2026-{S['seq']['doc']:04d}"

    def add_doc(**o):
        prefixes = {
            "Devis": "DEV",
            "Commande": "CMD",
            "Bon de livraison": "BL",
            "Facture": "FAC",
            "Avoir": "AV",
            "Facture d’achat": "FA",
            "Commande d’achat": "CA",
        }
        ht = o["ht"]
        tva = round(ht * S["co"]["tva"])
        total = ht + tva
        doc = {"id": nid(prefixes.get(o["type"], "DOC")), **o, "tva": tva, "total": total}
        S["docs"].append(doc)
        if o["type"] == "Facture":
            post(o["d"], "VT", doc["id"], "Facture " + o["cl"], [["411", total, 0], [o.get("rev") or "701", 0, ht], ["4431", 0, tva]])
            if o.get("st") == "Payée":
                post(o["d"], "BQ", doc["id"], "Règlement " + o["cl"], [["521", total, 0], ["411", 0, total]])
        if o["type"] == "Facture d’achat":
            post(o["d"], "AC", doc["id"], "Achat " + o["cl"], [[o.get("chg") or "601", ht, 0], ["4452", tva, 0], ["401", 0, total]])
            if o.get("st") == "Payée":
                post(o["d"], "BQ", doc["id"], "Paiement " + o["cl"], [["401", total, 0], ["521", 0, total]])
        return doc

    post(
        "2026-01-01",
        "OD",
        "AN-0001",
        "À nouveaux",
        [
            ["521", 450e6, 0],
            ["571", 18e6, 0],
            ["585", 6.5e6, 0],
            ["211", 120e6, 0],
            ["213", 820e6, 0],
            ["244", 1150e6, 0],
            ["245", 28e6, 0],
            ["281", 0, 410e6],
            ["31", 86e6, 0],
            ["101", 0, 2268.5e6],
        ],
    )
    post("2026-10-05", "AC", "AC-0091", "Achat gasoil — TotalEnergies", [["605", 42e6, 0], ["4452", 7.56e6, 0], ["401", 0, 49.56e6]])
    post("2026-10-12", "BQ", "BQ-0188", "Loyer entrepôt", [["613", 6.5e6, 0], ["4452", 1.17e6, 0], ["521", 0, 7.67e6]])
    add_doc(type="Facture", cl="Mining Corp Guinée", d="2026-10-02", ht=84e6, st="Payée", rev="706")
    add_doc(type="Facture", cl="SOGUIPAMI Transport", d="2026-10-14", ht=52.5e6, st="Impayée", rev="706")
    add_doc(type="Facture", cl="Station Total Kaloum", d="2026-09-20", ht=31e6, st="Impayée", rev="701")
    add_doc(type="Facture", cl="Ets Diallo et Fils", d="2026-10-21", ht=18.2e6, st="Payée", rev="701")
    add_doc(type="Facture", cl="Bauxite Logistics", d="2026-10-29", ht=96e6, st="Impayée", rev="706")
    add_doc(type="Devis", cl="Mining Corp Guinée", d=TODAY, ht=120e6, st="Envoyé", rev="706")
    add_doc(type="Commande", cl="SOGUIPAMI Transport", d=TODAY, ht=64e6, st="En cours", rev="706")
    add_doc(type="Bon de livraison", cl="Station Total Kaloum", d=TODAY, ht=9.4e6, st="Livré", rev="701")
    add_doc(type="Facture d’achat", cl="TotalEnergies Guinée", d="2026-10-18", ht=28e6, st="À payer", chg="605")
    add_doc(type="Facture d’achat", cl="CFAO Equipment", d="2026-10-08", ht=12.4e6, st="Payée", chg="622")
    add_doc(type="Avoir", cl="Ets Diallo et Fils", d="2026-10-25", ht=1.8e6, st="Validé", rev="701")
    post("2026-10-31", "PA", "PA-2026-0010", "Paie octobre", [["661", payroll, 0], ["421", 0, payroll]])
    return S


def init_database(force: bool = False) -> None:
    if force or Company.query.first() is None:
        state_to_db(demo_state())
    else:
        load_fast()
    from app.security import seed_users

    seed_users()


def reset_database() -> None:
    db.drop_all()
    db.create_all()
    init_database(force=True)
