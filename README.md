# Fastlane Gestion

Application de gestion, comptabilité et logistique (modèles Sage regroupés).
Les données sont stockées dans **SQLite** (`data/logigest.db`), pas dans PostgreSQL.

## Structure

```
app/                Backend Flask
  models.py         Tables SQLAlchemy
  serialize.py      Conversion état métier ↔ SQLite
  seed.py           Données démo (SYSCOHADA, GNF)
  routes/           API REST + page d’accueil
static/css          Interface
static/js           Application (saisie, journaux, flotte…)
templates/          Page HTML
data/               Fichier SQLite
scripts/            Initialisation et lancement
```

## Installation

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/init_db.py
python run.py
```

Ouvrir [http://127.0.0.1:5000](http://127.0.0.1:5000).

## Base SQLite

Tables : `company`, `sequences`, `accounts`, `journal_types`, `parties`, `articles`, `documents`, `journal_lines`, `vehicles`, `missions`, `assets`, `employees`, `payslips`.

API utile :

- `GET /api/state` — état complet
- `PUT /api/state` — enregistrement
- `POST /api/reset` — recharge la démo
- `GET /api/documents`, `/api/journal`, `/api/articles`, `/api/vehicles`, …

Recréer la base :

```bash
python scripts/init_db.py
```
