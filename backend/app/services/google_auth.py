from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.config import settings

_request = google_requests.Request()


def verify_google_id_token(token: str) -> dict:
    """Verify a Google Identity Services ID token and return its claims.

    Raises ValueError if the token is invalid, expired, or not issued for this app.
    """
    return id_token.verify_oauth2_token(token, _request, settings.google_client_id)
