from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_student
from app.models import AchievementLevel, CertificateType, Student, StudentCertificate, Subject, SubjectGrade
from app.schemas import (
    AchievementLevelOut,
    AttendanceInput,
    CertificateTypeOut,
    StudentCertificateSet,
    StudentOut,
    SubjectGradeOut,
    SubjectGradeUpsert,
    SubjectOut,
    VolunteerInput,
)

router = APIRouter(prefix="/student", tags=["student"])

VALID_SLOTS = {(1, 1), (1, 2), (2, 1), (2, 2), (3, 1)}


@router.get("/me", response_model=StudentOut)
def my_profile(student: Student = Depends(get_current_student)) -> dict:
    return {
        "id": student.id,
        "name": student.name,
        "no_attendance_record": student.no_attendance_record,
        "absence_days": student.absence_days,
        "volunteer_hours": student.volunteer_hours,
        "username": student.user.username,
    }


@router.get("/subjects", response_model=list[SubjectOut])
def list_subjects(db: Session = Depends(get_db), _: Student = Depends(get_current_student)) -> list:
    return db.query(Subject).order_by(Subject.name).all()


@router.get("/achievement-levels", response_model=list[AchievementLevelOut])
def list_achievement_levels(db: Session = Depends(get_db), _: Student = Depends(get_current_student)) -> list:
    return db.query(AchievementLevel).order_by(AchievementLevel.sort_order).all()


@router.get("/grades", response_model=list[SubjectGradeOut])
def list_grades(student: Student = Depends(get_current_student)) -> list:
    return student.grades


@router.put("/grades", response_model=SubjectGradeOut)
def upsert_grade(
    payload: SubjectGradeUpsert,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
) -> SubjectGrade:
    if (payload.year, payload.semester) not in VALID_SLOTS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "유효하지 않은 학년/학기입니다")
    subject = db.get(Subject, payload.subject_id)
    if subject is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "과목을 찾을 수 없습니다")

    existing = (
        db.query(SubjectGrade)
        .filter(
            SubjectGrade.student_id == student.id,
            SubjectGrade.subject_id == payload.subject_id,
            SubjectGrade.year == payload.year,
            SubjectGrade.semester == payload.semester,
        )
        .first()
    )
    if existing:
        existing.achievement_code = payload.achievement_code
        db.commit()
        db.refresh(existing)
        return existing

    grade = SubjectGrade(
        student_id=student.id,
        subject_id=payload.subject_id,
        year=payload.year,
        semester=payload.semester,
        achievement_code=payload.achievement_code,
    )
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


@router.delete("/grades/{grade_id}")
def delete_grade(
    grade_id: int,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
) -> dict:
    grade = db.get(SubjectGrade, grade_id)
    if grade is None or grade.student_id != student.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "성적 기록을 찾을 수 없습니다")
    db.delete(grade)
    db.commit()
    return {"ok": True}


@router.put("/attendance")
def update_attendance(
    payload: AttendanceInput,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
) -> dict:
    if payload.absence_days < 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "결석일수는 0 이상이어야 합니다")
    student.absence_days = payload.absence_days
    student.no_attendance_record = payload.no_attendance_record
    db.commit()
    return {"ok": True}


@router.put("/volunteer")
def update_volunteer(
    payload: VolunteerInput,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
) -> dict:
    if payload.volunteer_hours < 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "봉사시간은 0 이상이어야 합니다")
    student.volunteer_hours = payload.volunteer_hours
    db.commit()
    return {"ok": True}


@router.get("/certificate-types", response_model=list[CertificateTypeOut])
def list_certificate_types(db: Session = Depends(get_db), _: Student = Depends(get_current_student)) -> list:
    return db.query(CertificateType).order_by(CertificateType.name).all()


@router.get("/certificates", response_model=list[int])
def my_certificates(student: Student = Depends(get_current_student)) -> list:
    return [sc.certificate_type_id for sc in student.certificates]


@router.put("/certificates")
def set_certificates(
    payload: StudentCertificateSet,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
) -> dict:
    valid_ids = {c.id for c in db.query(CertificateType.id).filter(CertificateType.id.in_(payload.certificate_type_ids))}
    if len(valid_ids) != len(set(payload.certificate_type_ids)):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "존재하지 않는 자격증 종류가 포함되어 있습니다")

    db.query(StudentCertificate).filter(StudentCertificate.student_id == student.id).delete()
    for cid in valid_ids:
        db.add(StudentCertificate(student_id=student.id, certificate_type_id=cid))
    db.commit()
    return {"ok": True}
