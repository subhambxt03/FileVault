from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.statistics import StatisticsOut
from app.services import statistics_service
from app.utils.security import get_current_user

router = APIRouter(tags=["statistics"])


@router.get("/statistics", response_model=StatisticsOut)
def statistics(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    return statistics_service.for_user(db, current.id)