from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_user_id
from app.schemas.planner import GeneratePlanRequest, PlannerPreview, PreviewPlanRequest
from app.services.planner import preview_plan, save_preview_as_blocks

router = APIRouter(prefix="/planner", tags=["planner"])


@router.post("/preview", response_model=PlannerPreview)
def planner_preview(payload: PreviewPlanRequest, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    try:
        return preview_plan(db=db, user_id=user_id, start=payload.start_date, end=payload.end_date)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/generate-and-save", response_model=PlannerPreview)
def generate_and_save(payload: GeneratePlanRequest, db: Session = Depends(get_db), user_id: str = Depends(get_user_id)):
    try:
        preview = preview_plan(db=db, user_id=user_id, start=payload.start_date, end=payload.end_date)
        save_preview_as_blocks(db=db, user_id=user_id, preview=preview)
        return preview
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc