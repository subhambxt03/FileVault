from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Notification
from app.schemas.notification import NotificationListOut


def create(db: Session, user_id: int, job_id: int | None, type_: str, message: str) -> Notification:
    n = Notification(user_id=user_id, job_id=job_id, type=type_, message=message)
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


def list_for_user(db: Session, user_id: int) -> NotificationListOut:
    items = db.execute(
        select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc())
    ).scalars().all()
    unread = db.execute(
        select(func.count(Notification.id)).where(Notification.user_id == user_id, Notification.is_read.is_(False))
    ).scalar_one()
    return NotificationListOut(total=len(items), unread=unread, items=list(items))


def mark_read(db: Session, user_id: int, notification_id: int) -> Notification | None:
    n = db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
    ).scalar_one_or_none()
    if not n:
        return None
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n


def mark_all_read(db: Session, user_id: int) -> None:
    for n in db.execute(select(Notification).where(Notification.user_id == user_id, Notification.is_read.is_(False))).scalars():
        n.is_read = True
    db.commit()