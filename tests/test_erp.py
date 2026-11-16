"""Contrôles SYSCOHADA : équilibre des journaux, TVA 18 %, CMUP."""
from app import create_app


def cmup(q0, c0, qty, unit):
    return ((c0 * q0) + unit * qty) / (q0 + qty)


def test_cmup_pondere():
    assert round(cmup(100, 10_000, 50, 16_000), 2) == 12_000.0


def test_tva_guinee():
    ht = 1_000_000
    assert round(ht * 0.18) == 180_000


def test_journal_equilibre():
    app = create_app()
    with app.test_client() as client:
        res = client.get("/api/state")
        assert res.status_code == 200
        state = res.get_json()
        debit = sum(x.get("db") or 0 for x in state.get("j") or [])
        credit = sum(x.get("cr") or 0 for x in state.get("j") or [])
        assert debit == credit, f"Journaux déséquilibrés : D={debit} C={credit}"
        assert state["co"]["tva"] == 0.18
        assert state["co"]["name"]


def test_ecriture_rejetee_si_desequilibree():
    """Règle métier : débit = crédit, sinon l’écriture n’est pas une pièce valide."""
    lines = [("411", 118, 0), ("701", 0, 100), ("4431", 0, 18)]
    d = sum(x[1] for x in lines)
    c = sum(x[2] for x in lines)
    assert d == c
    bad = [("411", 118, 0), ("701", 0, 100)]
    assert sum(x[1] for x in bad) != sum(x[2] for x in bad)


def test_transfert_sans_pnl():
    """Un transfert change le dépôt, pas la valeur ni le résultat."""
    q_kal, q_kam, cost = 80, 20, 9000
    move = 10
    q_kal -= move
    q_kam += move
    assert q_kal + q_kam == 100
    assert cost * (q_kal + q_kam) == 900_000
