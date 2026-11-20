"""Entrypoint Vercel / WSGI."""
import traceback

try:
    from app import create_app

    app = create_app()
except Exception:
    from flask import Flask

    _err = traceback.format_exc()
    print(_err, flush=True)
    app = Flask(__name__)

    @app.get("/")
    @app.get("/<path:_rest>")
    def _boot_error(_rest=""):
        return (
            "<h1>Fastlane — erreur de démarrage Vercel</h1>"
            f"<pre style='white-space:pre-wrap'>{_err}</pre>",
            500,
        )
