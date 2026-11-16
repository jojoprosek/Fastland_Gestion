"""Crée (ou recrée) la base SQLite et charge les données démo."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from app.database import db
from app.seed import reset_database


def main() -> None:
    app = create_app()
    with app.app_context():
        db.create_all()
        reset_database()
        print("Base SQLite prête : data/logigest.db")


if __name__ == "__main__":
    main()
