from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.models import (
    AchievementLevel,
    AdmissionType,
    AdmissionTypeConfig,
    AttendanceScoreRule,
    CertificateType,
    Subject,
    VolunteerConfig,
)
from app.schemas import (
    AchievementLevelCreate,
    AchievementLevelOut,
    AdmissionTypeConfigBase,
    AdmissionTypeOut,
    AttendanceScoreRuleBase,
    AttendanceScoreRuleOut,
    CertificateTypeCreate,
    CertificateTypeOut,
    SubjectCreate,
    SubjectOut,
    VolunteerConfigBase,
    VolunteerConfigOut,
)

router = APIRouter(prefix="/admin", tags=["admin-reference"], dependencies=[Depends(require_admin)])


# ---- subjects ----
@router.get("/subjects", response_model=list[SubjectOut])
def list_subjects(db: Session = Depends(get_db)) -> list:
    return db.query(Subject).order_by(Subject.name).all()


@router.post("/subjects", response_model=SubjectOut)
def create_subject(payload: SubjectCreate, db: Session = Depends(get_db)) -> Subject:
    if db.query(Subject).filter(Subject.name == payload.name).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 존재하는 과목명입니다")
    subject = Subject(**payload.model_dump())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.put("/subjects/{subject_id}", response_model=SubjectOut)
def update_subject(subject_id: int, payload: SubjectCreate, db: Session = Depends(get_db)) -> Subject:
    subject = db.get(Subject, subject_id)
    if subject is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "과목을 찾을 수 없습니다")
    for k, v in payload.model_dump().items():
        setattr(subject, k, v)
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db)) -> dict:
    subject = db.get(Subject, subject_id)
    if subject is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "과목을 찾을 수 없습니다")
    db.delete(subject)
    db.commit()
    return {"ok": True}


# ---- achievement levels ----
@router.get("/achievement-levels", response_model=list[AchievementLevelOut])
def list_achievement_levels(db: Session = Depends(get_db)) -> list:
    return db.query(AchievementLevel).order_by(AchievementLevel.sort_order).all()


@router.post("/achievement-levels", response_model=AchievementLevelOut)
def create_achievement_level(payload: AchievementLevelCreate, db: Session = Depends(get_db)) -> AchievementLevel:
    if db.query(AchievementLevel).filter(AchievementLevel.code == payload.code).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 존재하는 코드입니다")
    level = AchievementLevel(**payload.model_dump())
    db.add(level)
    db.commit()
    db.refresh(level)
    return level


@router.put("/achievement-levels/{level_id}", response_model=AchievementLevelOut)
def update_achievement_level(level_id: int, payload: AchievementLevelCreate, db: Session = Depends(get_db)) -> AchievementLevel:
    level = db.get(AchievementLevel, level_id)
    if level is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "성취도 항목을 찾을 수 없습니다")
    for k, v in payload.model_dump().items():
        setattr(level, k, v)
    db.commit()
    db.refresh(level)
    return level


@router.delete("/achievement-levels/{level_id}")
def delete_achievement_level(level_id: int, db: Session = Depends(get_db)) -> dict:
    level = db.get(AchievementLevel, level_id)
    if level is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "성취도 항목을 찾을 수 없습니다")
    db.delete(level)
    db.commit()
    return {"ok": True}


# ---- certificate types ----
@router.get("/certificate-types", response_model=list[CertificateTypeOut])
def list_certificate_types(db: Session = Depends(get_db)) -> list:
    return db.query(CertificateType).order_by(CertificateType.name).all()


@router.post("/certificate-types", response_model=CertificateTypeOut)
def create_certificate_type(payload: CertificateTypeCreate, db: Session = Depends(get_db)) -> CertificateType:
    if db.query(CertificateType).filter(CertificateType.name == payload.name).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 존재하는 자격증명입니다")
    cert = CertificateType(**payload.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


@router.put("/certificate-types/{cert_id}", response_model=CertificateTypeOut)
def update_certificate_type(cert_id: int, payload: CertificateTypeCreate, db: Session = Depends(get_db)) -> CertificateType:
    cert = db.get(CertificateType, cert_id)
    if cert is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "자격증 종류를 찾을 수 없습니다")
    for k, v in payload.model_dump().items():
        setattr(cert, k, v)
    db.commit()
    db.refresh(cert)
    return cert


@router.delete("/certificate-types/{cert_id}")
def delete_certificate_type(cert_id: int, db: Session = Depends(get_db)) -> dict:
    cert = db.get(CertificateType, cert_id)
    if cert is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "자격증 종류를 찾을 수 없습니다")
    db.delete(cert)
    db.commit()
    return {"ok": True}


# ---- attendance score rules ----
@router.get("/attendance-rules", response_model=list[AttendanceScoreRuleOut])
def list_attendance_rules(db: Session = Depends(get_db)) -> list:
    return db.query(AttendanceScoreRule).order_by(AttendanceScoreRule.absence_days).all()


@router.put("/attendance-rules", response_model=list[AttendanceScoreRuleOut])
def replace_attendance_rules(payload: list[AttendanceScoreRuleBase], db: Session = Depends(get_db)) -> list:
    days_seen = [r.absence_days for r in payload]
    if len(days_seen) != len(set(days_seen)):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "결석일수가 중복되었습니다")
    db.query(AttendanceScoreRule).delete()
    rules = [AttendanceScoreRule(absence_days=r.absence_days, score=r.score) for r in payload]
    db.add_all(rules)
    db.commit()
    return db.query(AttendanceScoreRule).order_by(AttendanceScoreRule.absence_days).all()


# ---- volunteer config ----
@router.get("/volunteer-config", response_model=VolunteerConfigOut)
def get_volunteer_config(db: Session = Depends(get_db)) -> VolunteerConfig:
    config = db.query(VolunteerConfig).first()
    if config is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "봉사활동 설정이 없습니다")
    return config


@router.put("/volunteer-config", response_model=VolunteerConfigOut)
def update_volunteer_config(payload: VolunteerConfigBase, db: Session = Depends(get_db)) -> VolunteerConfig:
    config = db.query(VolunteerConfig).first()
    if config is None:
        config = VolunteerConfig()
        db.add(config)
    for k, v in payload.model_dump().items():
        setattr(config, k, v)
    db.commit()
    db.refresh(config)
    return config


# ---- admission types ----
@router.get("/admission-types", response_model=list[AdmissionTypeOut])
def list_admission_types(db: Session = Depends(get_db)) -> list:
    return db.query(AdmissionType).all()


@router.put("/admission-types/{admission_type_id}/config", response_model=AdmissionTypeOut)
def update_admission_type_config(
    admission_type_id: int, payload: AdmissionTypeConfigBase, db: Session = Depends(get_db)
) -> AdmissionType:
    admission_type = db.get(AdmissionType, admission_type_id)
    if admission_type is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "전형을 찾을 수 없습니다")
    config = admission_type.config
    if config is None:
        config = AdmissionTypeConfig(admission_type_id=admission_type_id)
        db.add(config)
    for k, v in payload.model_dump().items():
        setattr(config, k, v)
    db.commit()
    db.refresh(admission_type)
    return admission_type
