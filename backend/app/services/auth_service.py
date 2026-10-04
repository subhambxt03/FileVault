
import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User
from app.schemas.user import UserOut
from app.storage import get_storage
from app.utils.security import hash_password, verify_password


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.execute(select(User).where(User.email == email.lower())).scalar_one_or_none()


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.execute(select(User).where(User.username == username)).scalar_one_or_none()


def create_user(db: Session, name: str, email: str, password: str) -> User:
    user = User(name=name.strip(), email=email.lower(), password_hash=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def update_profile(db: Session, user: User, **fields) -> User:
    for key, value in fields.items():
        if value is not None:
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user: User, current_password: str, new_password: str) -> bool:
    if not verify_password(current_password, user.password_hash):
        return False
    user.password_hash = hash_password(new_password)
    db.commit()
    return True


def serialize_user(user: User) -> UserOut:
    """
    Convert a User ORM object into UserOut.

    avatar_url is returned as a *relative* API path (e.g. /auth/avatar/3) so
    the browser can fetch it through the backend rather than the private
    MinIO hostname. The frontend prefixes it with the API base URL.
    """
    out = UserOut.model_validate(user)

    if user.avatar_key:
        out.avatar_url = f"/auth/avatar/{user.id}"
    else:
        out.avatar_url = None

    if user.integrations:
        try:
            out.integrations = json.loads(user.integrations)
        except Exception:
            out.integrations = {}

    return out
