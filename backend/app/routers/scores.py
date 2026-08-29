from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_student, require_admin
from app.models import Student, User
from app.schemas import AdmissionScoreResult
from app.services.score_service import compute_all_scores

router = APIRouter(tags=["scores"])


@router.get("/students/me/scores", response_model=list[AdmissionScoreResult])
def my_scores(student: Student = Depends(get_current_student), db: Session = Depends(get_db)) -> list:
    return compute_all_scores(db, student)


@router.get("/admin/students/{student_id}/scores", response_model=list[AdmissionScoreResult])
def student_scores(
    student_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list:
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "학생을 찾을 수 없습니다")
    return compute_all_scores(db, student)
