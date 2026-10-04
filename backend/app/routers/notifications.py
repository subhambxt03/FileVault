from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.notification import NotificationListOut, NotificationOut
from app.services import notification_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListOut)
def list_notifications(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    return notification_service.list_for_user(db, current.id)


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    notif = notification_service.mark_read(db, current.id, notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return notif


@router.patch("/read-all", status_code=204)
def mark_all_read(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    notification_service.mark_all_read(db, current.id)