from sqlalchemy.orm import Session

from app.config import settings
from app.models import (
    AchievementLevel,
    AdmissionType,
    AdmissionTypeCode,
    AdmissionTypeConfig,
    AttendanceScoreRule,
    Role,
    User,
    VolunteerConfig,
)
from app.security import hash_password

ATTENDANCE_TABLE = {
    0: 18, 1: 17, 2: 16, 3: 15, 4: 14, 5: 13, 6: 12, 7: 11,
    8: 10, 9: 9, 10: 8, 11: 7, 12: 6, 13: 5, 14: 4, 15: 3,
}

ACHIEVEMENT_LEVELS = [
    ("A", 5, 1),
    ("B", 4, 2),
    ("C", 3, 3),
    ("D", 2, 4),
    ("E", 1, 5),
]

ADMISSION_TYPES = [
    {
        "code": AdmissionTypeCode.meister,
        "name": "마이스터인재전형",
        "subject_score_max": 120,
        "subject_base_score": 45.5,
        "coef_y2": 2.88,
        "coef_y3": 8.64,  # 4.32 x 2
        "info_weight_multiplier": 0.5,
        "attendance_max": 18,
        "service_max": 18,
        "bonus_max": 4,
        "stage1_total": 160,
        "stage2_interview_max": 120,
        "stage2_coding_max": 80,
        "stage2_aptitude_max": 40,
        "stage2_total": 240,
        "total_max": 400,
    },
    {
        "code": AdmissionTypeCode.social,
        "name": "사회통합전형",
        "subject_score_max": 120,
        "subject_base_score": 45.5,
        "coef_y2": 2.88,
        "coef_y3": 8.64,
        "info_weight_multiplier": 0.5,
        "attendance_max": 18,
        "service_max": 18,
        "bonus_max": 4,
        "stage1_total": 160,
        "stage2_interview_max": 200,
        "stage2_coding_max": None,
        "stage2_aptitude_max": 40,
        "stage2_total": 240,
        "total_max": 400,
    },
    {
        "code": AdmissionTypeCode.general,
        "name": "일반전형",
        "subject_score_max": 200,
        "subject_base_score": 77.5,
        "coef_y2": 4.8,
        "coef_y3": 14.4,  # 7.2 x 2
        "info_weight_multiplier": 0.5,
        "attendance_max": 18,
        "service_max": 18,
        "bonus_max": 4,
        "stage1_total": 240,
        "stage2_interview_max": 120,
        "stage2_coding_max": None,
        "stage2_aptitude_max": 40,
        "stage2_total": 160,
        "total_max": 400,
    },
]


def run_seed(db: Session) -> None:
    if not db.query(AchievementLevel).first():
        for code, score, order in ACHIEVEMENT_LEVELS:
            db.add(AchievementLevel(code=code, score=score, sort_order=order))

    if not db.query(AttendanceScoreRule).first():
        for days, score in ATTENDANCE_TABLE.items():
            db.add(AttendanceScoreRule(absence_days=days, score=score))

    if not db.query(VolunteerConfig).first():
        db.add(VolunteerConfig(base_points=18, required_hours=30, min_hours_floor=15, penalty_per_hour=0.5))

    if not db.query(AdmissionType).first():
        for cfg in ADMISSION_TYPES:
            at = AdmissionType(code=cfg["code"], name=cfg["name"])
            db.add(at)
            db.flush()
            db.add(
                AdmissionTypeConfig(
                    admission_type_id=at.id,
                    subject_score_max=cfg["subject_score_max"],
                    subject_base_score=cfg["subject_base_score"],
                    coef_y2=cfg["coef_y2"],
                    coef_y3=cfg["coef_y3"],
                    info_weight_multiplier=cfg["info_weight_multiplier"],
                    attendance_max=cfg["attendance_max"],
                    service_max=cfg["service_max"],
                    bonus_max=cfg["bonus_max"],
                    stage1_total=cfg["stage1_total"],
                    stage2_interview_max=cfg["stage2_interview_max"],
                    stage2_coding_max=cfg["stage2_coding_max"],
                    stage2_aptitude_max=cfg["stage2_aptitude_max"],
                    stage2_total=cfg["stage2_total"],
                    total_max=cfg["total_max"],
                )
            )

    if not db.query(User).filter(User.username == settings.admin_initial_username).first():
        db.add(
            User(
                username=settings.admin_initial_username,
                password_hash=hash_password(settings.admin_initial_password),
                role=Role.admin,
            )
        )

    db.commit()
