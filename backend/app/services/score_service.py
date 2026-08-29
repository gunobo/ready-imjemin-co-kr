from sqlalchemy.orm import Session

from app.models import (
    AchievementLevel,
    AdmissionType,
    AttendanceScoreRule,
    Stage2Score,
    Student,
    VolunteerConfig,
)
from app.schemas import (
    AdmissionScoreResult,
    Stage1Breakdown,
    Stage2Breakdown,
    SubjectScoreBreakdown,
)
from app.services.scoring import (
    GradeEntry,
    compute_attendance_score,
    compute_bonus_score,
    compute_subject_score,
    compute_volunteer_score,
)


def compute_score_for_admission_type(db: Session, student: Student, admission_type: AdmissionType) -> AdmissionScoreResult:
    config = admission_type.config

    level_map = {lvl.code: lvl.score for lvl in db.query(AchievementLevel).all()}
    fallback_c = level_map.get("C", 0.0)

    grade_entries = [
        GradeEntry(
            year=g.year,
            semester=g.semester,
            score=level_map.get(g.achievement_code, 0.0),
            is_math=g.subject.is_math,
            is_informatics=g.subject.is_informatics,
        )
        for g in student.grades
    ]
    subject_result = compute_subject_score(
        grade_entries,
        subject_base_score=config.subject_base_score,
        coef_y2=config.coef_y2,
        coef_y3=config.coef_y3,
        info_weight_multiplier=config.info_weight_multiplier,
        subject_score_max=config.subject_score_max,
        fallback_informatics_score=fallback_c,
    )

    attendance_table = {r.absence_days: r.score for r in db.query(AttendanceScoreRule).all()}
    attendance_score = compute_attendance_score(
        no_attendance_record=student.no_attendance_record,
        absence_days=student.absence_days,
        attendance_table=attendance_table,
    )

    volunteer_config = db.query(VolunteerConfig).first()
    volunteer_score = compute_volunteer_score(
        volunteer_hours=student.volunteer_hours,
        base_points=volunteer_config.base_points,
        required_hours=volunteer_config.required_hours,
        min_hours_floor=volunteer_config.min_hours_floor,
        penalty_per_hour=volunteer_config.penalty_per_hour,
    )

    certificate_points = [sc.certificate_type.points for sc in student.certificates]
    bonus_score = compute_bonus_score(certificate_points=certificate_points, bonus_max=config.bonus_max)

    stage1_total = subject_result.subject_score + attendance_score + volunteer_score + bonus_score

    stage2_row = (
        db.query(Stage2Score)
        .filter(Stage2Score.student_id == student.id, Stage2Score.admission_type_id == admission_type.id)
        .first()
    )
    interview_score = stage2_row.interview_score if stage2_row else 0.0
    coding_score = stage2_row.coding_score if stage2_row else (None if config.stage2_coding_max is None else 0.0)
    aptitude_score = stage2_row.aptitude_score if stage2_row else 0.0
    stage2_total = interview_score + (coding_score or 0.0) + aptitude_score

    return AdmissionScoreResult(
        admission_type_code=admission_type.code,
        admission_type_name=admission_type.name,
        stage1=Stage1Breakdown(
            subject=SubjectScoreBreakdown(**subject_result.__dict__),
            attendance_score=attendance_score,
            volunteer_score=volunteer_score,
            bonus_score=bonus_score,
            stage1_total=round(stage1_total, 3),
        ),
        stage2=Stage2Breakdown(
            interview_score=interview_score,
            coding_score=coding_score,
            aptitude_score=aptitude_score,
            stage2_total=round(stage2_total, 3),
        ),
        total_score=round(stage1_total + stage2_total, 3),
        total_max=config.total_max,
    )


def compute_all_scores(db: Session, student: Student) -> list[AdmissionScoreResult]:
    admission_types = db.query(AdmissionType).all()
    return [compute_score_for_admission_type(db, student, at) for at in admission_types]
