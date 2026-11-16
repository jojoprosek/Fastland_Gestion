from flask import Flask

from app.config import Config
from app.database import db


def create_app() -> Flask:
    app = Flask(__name__, static_folder="../static", template_folder="../templates")
    app.config.from_object(Config)

    db.init_app(app)

    from app import models  # noqa: F401
    from app.routes import bp

    app.register_blueprint(bp)

    with app.app_context():
        from app.seed import init_database

        db.create_all()
        init_database()

    return app
