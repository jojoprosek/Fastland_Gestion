"""Entrypoint Vercel (même convention que l’exemple officiel Flask)."""
import traceback

from flask import Flask

try:
    from app import create_app

    app = create_app()
except Exception:
    _err = traceback.format_exc()
    print(_err, flush=True)
    app = Flask(__name__)

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def _boot_error(path=""):
        return (
            "<h1>Fastlane — erreur de démarrage Vercel</h1>"
            f"<pre style='white-space:pre-wrap'>{_err}</pre>",
            500,
        )
