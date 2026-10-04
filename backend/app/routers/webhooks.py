from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.webhook import WebhookCreate, WebhookOut
from app.services import webhook_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("", response_model=WebhookOut, status_code=201)
def create(payload: WebhookCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    return webhook_service.create(db, current.id, str(payload.url))


@router.get("", response_model=list[WebhookOut])
def list_all(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    return webhook_service.list_for_user(db, current.id)


@router.delete("/{webhook_id}", status_code=204)
def delete(webhook_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    ok = webhook_service.delete(db, current.id, webhook_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Webhook not found.")