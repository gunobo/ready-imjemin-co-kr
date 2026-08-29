from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.models import AdmissionType, Stage2Score, Student, SubjectGrade
from app.schemas import (
    Stage2ScoreOut,
    Stage2ScoreUpsert,
    StudentOut,
    StudentUpdate,
    SubjectGradeOut,
)

router = APIRouter(prefix="/admin", tags=["admin-students"], dependencies=[Depends(require_admin)])


def _to_student_out(student: Student) -> dict:
    return {
        "id": student.id,
        "name": student.name,
        "no_attendance_record": student.no_attendance_record,
        "absence_days": student.absence_days,
        "volunteer_hours": student.volunteer_hours,
        "username": student.user.username,
    }


@router.get("/students", response_model=list[StudentOut])
def list_students(db: Session = Depends(get_db)) -> list:
    students = db.query(Student).all()
    return [_to_student_out(s) for s in students]


@router.get("/students/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db)) -> dict:
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "학생을 찾을 수 없습니다")
    return _to_student_out(student)


@router.put("/students/{student_id}", response_model=StudentOut)
def update_student(student_id: int, payload: StudentUpdate, db: Session = Depends(get_db)) -> dict:
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "학생을 찾을 수 없습니다")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(student, k, v)
    db.commit()
    db.refresh(student)
    return _to_student_out(student)


@router.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)) -> dict:
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "학생을 찾을 수 없습니다")
    user = student.user
    db.delete(student)
    db.delete(user)
    db.commit()
    return {"ok": True}


@router.get("/students/{student_id}/grades", response_model=list[SubjectGradeOut])
def student_grades(student_id: int, db: Session = Depends(get_db)) -> list:
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "학생을 찾을 수 없습니다")
    return student.grades


@router.get("/students/{student_id}/stage2-scores", response_model=list[Stage2ScoreOut])
def get_stage2_scores(student_id: int, db: Session = Depends(get_db)) -> list:
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "학생을 찾을 수 없습니다")
    return student.stage2_scores


@router.put("/students/{student_id}/stage2-scores", response_model=Stage2ScoreOut)
def upsert_stage2_score(student_id: int, payload: Stage2ScoreUpsert, db: Session = Depends(get_db)) -> Stage2Score:
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "학생을 찾을 수 없습니다")
    admission_type = db.get(AdmissionType, payload.admission_type_id)
    if admission_type is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "전형을 찾을 수 없습니다")

    row = (
        db.query(Stage2Score)
        .filter(Stage2Score.student_id == student_id, Stage2Score.admission_type_id == payload.admission_type_id)
        .first()
    )
    if row is None:
        row = Stage2Score(student_id=student_id, admission_type_id=payload.admission_type_id)
        db.add(row)
    row.interview_score = payload.interview_score
    row.coding_score = payload.coding_score
    row.aptitude_score = payload.aptitude_score
    db.commit()
    db.refresh(row)
    return row
