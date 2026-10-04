import json
from datetime import datetime, timezone
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas.integration import IntegrationConnectOut, IntegrationOut
from app.services import auth_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/integrations", tags=["integrations"])

PROVIDERS = {
    "google": {
        "name": "Google Drive",
        "description": "Access your files from Google Drive.",
        "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "scope": "https://www.googleapis.com/auth/drive.readonly",
        "client_id_attr": "GOOGLE_CLIENT_ID",
    },
    "dropbox": {
        "name": "Dropbox",
        "description": "Sync files with Dropbox.",
        "authorize_url": "https://www.dropbox.com/oauth2/authorize",
        "scope": "files.metadata.read",
        "client_id_attr": "DROPBOX_CLIENT_ID",
    },
    "github": {
        "name": "GitHub",
        "description": "Link your GitHub account.",
        "authorize_url": "https://github.com/login/oauth/authorize",
        "scope": "read:user",
        "client_id_attr": "GITHUB_CLIENT_ID",
    },
    "slack": {
        "name": "Slack",
        "description": "Get notifications in Slack.",
        "authorize_url": "https://slack.com/oauth/v2/authorize",
        "scope": "chat:write",
        "client_id_attr": "SLACK_CLIENT_ID",
    },
}


def _load(user: User) -> dict:
    if not user.integrations:
        return {}
    try:
        return json.loads(user.integrations)
    except Exception:
        return {}


def _save(db: Session, user: User, data: dict) -> None:
    user.integrations = json.dumps(data)
    db.commit()
    db.refresh(user)


@router.get("", response_model=list[IntegrationOut])
def list_integrations(current: User = Depends(get_current_user)):
    connected = _load(current)
    out = []
    for pid, meta in PROVIDERS.items():
        client_id = getattr(settings, meta["client_id_attr"], "")
        out.append(
            IntegrationOut(
                id=pid,
                name=meta["name"],
                description=meta["description"],
                configured=bool(client_id),
                connected=pid in connected,
                connected_at=connected.get(pid, {}).get("connected_at"),
            )
        )
    return out


@router.post("/{provider}/connect", response_model=IntegrationConnectOut)
def connect(provider: str, current: User = Depends(get_current_user)):
    meta = PROVIDERS.get(provider)
    if not meta:
        raise HTTPException(status_code=404, detail="Unknown provider.")

    client_id = getattr(settings, meta["client_id_attr"], "")
    if not client_id:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{meta['name']} is not configured. "
                f"Set {meta['client_id_attr']} and its secret in backend/.env, "
                "then restart the backend."
            ),
        )

    params = {
        "client_id": client_id,
        "redirect_uri": f"{settings.OAUTH_REDIRECT_BASE}/{provider}/callback",
        "scope": meta["scope"],
        "state": str(current.id),
        "response_type": "code",
    }
    return IntegrationConnectOut(authorize_url=f"{meta['authorize_url']}?{urlencode(params)}")


@router.delete("/{provider}", status_code=204)
def disconnect(
    provider: str,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if provider not in PROVIDERS:
        raise HTTPException(status_code=404, detail="Unknown provider.")
    data = _load(current)
    data.pop(provider, None)
    _save(db, current, data)


@router.post("/{provider}/demo-connect", response_model=IntegrationOut)
def demo_connect(
    provider: str,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """
    Development-only shortcut so the Connect UX can be exercised without
    real OAuth credentials. Refuses to run outside APP_ENV=development.
    """
    if settings.APP_ENV != "development":
        raise HTTPException(status_code=403, detail="Demo connect is disabled.")

    meta = PROVIDERS.get(provider)
    if not meta:
        raise HTTPException(status_code=404, detail="Unknown provider.")

    data = _load(current)
    data[provider] = {"connected_at": datetime.now(timezone.utc).isoformat()}
    _save(db, current, data)

    return IntegrationOut(
        id=provider,
        name=meta["name"],
        description=meta["description"],
        configured=bool(getattr(settings, meta["client_id_attr"], "")),
        connected=True,
        connected_at=data[provider]["connected_at"],
    )