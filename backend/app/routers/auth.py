from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas.user import (
    PasswordChange,
    TokenResponse,
    UserLogin,
    UserOut,
    UserRegister,
    UserUpdate,
)
from app.services import auth_service
from app.storage import get_storage
from app.utils.processors import process_avatar
from app.utils.security import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    if auth_service.get_user_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="Email already registered.")
    user = auth_service.create_user(db, payload.name, payload.email, payload.password)
    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token, user=auth_service.serialize_user(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = auth_service.authenticate(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token, user=auth_service.serialize_user(user))


@router.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)):
    return auth_service.serialize_user(current)


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if payload.username and payload.username != current.username:
        existing = auth_service.get_user_by_username(db, payload.username)
        if existing and existing.id != current.id:
            raise HTTPException(status_code=400, detail="Username is already taken.")

    updated = auth_service.update_profile(
        db, current,
        name=payload.name, username=payload.username,
        bio=payload.bio, location=payload.location, theme=payload.theme,
    )
    return auth_service.serialize_user(updated)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    ok = auth_service.change_password(db, current, payload.current_password, payload.new_password)
    if not ok:
        raise HTTPException(status_code=400, detail="Current password is incorrect.")


@router.post("/me/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Avatar must be an image.")

    raw = await file.read(settings.max_avatar_size_bytes + 1)
    if len(raw) > settings.max_avatar_size_bytes:
        raise HTTPException(status_code=413, detail=f"Avatar exceeds {settings.MAX_AVATAR_SIZE_MB} MB.")
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file.")

    try:
        processed = process_avatar(raw)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    key = f"users/{current.id}/avatar.jpg"
    get_storage().upload_bytes(key, processed, "image/jpeg")

    current.avatar_key = key
    db.commit()
    db.refresh(current)
    return auth_service.serialize_user(current)


@router.delete("/me/avatar", response_model=UserOut)
def delete_avatar(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    if current.avatar_key:
        try:
            get_storage().delete(current.avatar_key)
        except Exception:
            pass
        current.avatar_key = None
        db.commit()
        db.refresh(current)
    return auth_service.serialize_user(current)


@router.get("/avatar/{user_id}")
def get_avatar(user_id: int, db: Session = Depends(get_db)):
    """
    Public avatar endpoint. Returns the raw JPEG bytes so <img src> works
    without needing an Authorization header.
    """
    user = db.get(User, user_id)
    if not user or not user.avatar_key:
        raise HTTPException(status_code=404, detail="Avatar not found.")
    try:
        data = get_storage().download_bytes(user.avatar_key)
    except Exception:
        raise HTTPException(status_code=404, detail="Avatar not found.")
    return Response(
        content=data,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=60"},
    )
