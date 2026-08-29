from pydantic import BaseModel, ConfigDict

from app.models import AdmissionTypeCode, Role


# ---- auth ----
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role
    student_id: int | None = None
    username: str
    name: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ---- subjects ----
class SubjectBase(BaseModel):
    name: str
    is_math: bool = False
    is_informatics: bool = False


class SubjectCreate(SubjectBase):
    pass


class SubjectOut(SubjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---- achievement levels ----
class AchievementLevelBase(BaseModel):
    code: str
    score: float
    sort_order: int = 0


class AchievementLevelCreate(AchievementLevelBase):
    pass


class AchievementLevelOut(AchievementLevelBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---- certificate types ----
class CertificateTypeBase(BaseModel):
    name: str
    points: float


class CertificateTypeCreate(CertificateTypeBase):
    pass


class CertificateTypeOut(CertificateTypeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---- attendance rules ----
class AttendanceScoreRuleBase(BaseModel):
    absence_days: int
    score: float


class AttendanceScoreRuleOut(AttendanceScoreRuleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---- volunteer config ----
class VolunteerConfigBase(BaseModel):
    base_points: float
    required_hours: float
    min_hours_floor: float
    penalty_per_hour: float


class VolunteerConfigOut(VolunteerConfigBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---- admission type config ----
class AdmissionTypeConfigBase(BaseModel):
    subject_score_max: float
    subject_base_score: float
    coef_y2: float
    coef_y3: float
    info_weight_multiplier: float
    attendance_max: float
    service_max: float
    bonus_max: float
    stage1_total: float
    stage2_interview_max: float
    stage2_coding_max: float | None
    stage2_aptitude_max: float
    stage2_total: float
    total_max: float


class AdmissionTypeConfigOut(AdmissionTypeConfigBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class AdmissionTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: AdmissionTypeCode
    name: str
    config: AdmissionTypeConfigOut


# ---- students (admin) ----
class StudentCreate(BaseModel):
    username: str
    password: str
    name: str


class StudentUpdate(BaseModel):
    name: str | None = None
    no_attendance_record: bool | None = None
    absence_days: int | None = None


class ResetPasswordRequest(BaseModel):
    new_password: str


class StudentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    no_attendance_record: bool
    absence_days: int
    volunteer_hours: float
    username: str


# ---- subject grades ----
class SubjectGradeUpsert(BaseModel):
    subject_id: int
    year: int
    semester: int
    achievement_code: str


class SubjectGradeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    subject_id: int
    year: int
    semester: int
    achievement_code: str


# ---- attendance / volunteer (student self-input) ----
class AttendanceInput(BaseModel):
    absence_days: int
    no_attendance_record: bool = False


class VolunteerInput(BaseModel):
    volunteer_hours: float


# ---- certificates (student selection) ----
class StudentCertificateSet(BaseModel):
    certificate_type_ids: list[int]


# ---- stage2 (admin input) ----
class Stage2ScoreUpsert(BaseModel):
    admission_type_id: int
    interview_score: float
    coding_score: float | None = None
    aptitude_score: float


class Stage2ScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    admission_type_id: int
    interview_score: float
    coding_score: float | None
    aptitude_score: float


# ---- score breakdown ----
class SubjectScoreBreakdown(BaseModel):
    s21: float
    n21: float
    s22: float
    n22: float
    s31: float
    n31: float
    info_weight: float
    substitutions_applied: list[str]
    subject_score: float


class Stage1Breakdown(BaseModel):
    subject: SubjectScoreBreakdown
    attendance_score: float
    volunteer_score: float
    bonus_score: float
    stage1_total: float


class Stage2Breakdown(BaseModel):
    interview_score: float
    coding_score: float | None
    aptitude_score: float
    stage2_total: float


class AdmissionScoreResult(BaseModel):
    admission_type_code: AdmissionTypeCode
    admission_type_name: str
    stage1: Stage1Breakdown
    stage2: Stage2Breakdown
    total_score: float
    total_max: float
