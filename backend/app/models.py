import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Role(str, enum.Enum):
    admin = "admin"
    student = "student"


class AdmissionTypeCode(str, enum.Enum):
    meister = "meister"  # 마이스터인재전형
    social = "social"  # 사회통합전형
    general = "general"  # 일반전형


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    student: Mapped["Student"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    name: Mapped[str] = mapped_column(String(64))
    no_attendance_record: Mapped[bool] = mapped_column(Boolean, default=False)
    absence_days: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped[User] = relationship(back_populates="student")
    grades: Mapped[list["SubjectGrade"]] = relationship(back_populates="student", cascade="all, delete-orphan")
    certificates: Mapped[list["StudentCertificate"]] = relationship(
        back_populates="student", cascade="all, delete-orphan"
    )
    volunteer_hours: Mapped[float] = mapped_column(Float, default=0)
    stage2_scores: Mapped[list["Stage2Score"]] = relationship(back_populates="student", cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True)
    is_math: Mapped[bool] = mapped_column(Boolean, default=False)
    is_informatics: Mapped[bool] = mapped_column(Boolean, default=False)


class SubjectGrade(Base):
    __tablename__ = "subject_grades"
    __table_args__ = (UniqueConstraint("student_id", "subject_id", "year", "semester"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    year: Mapped[int] = mapped_column(Integer)  # 1, 2, 3
    semester: Mapped[int] = mapped_column(Integer)  # 1, 2
    achievement_code: Mapped[str] = mapped_column(String(8))

    student: Mapped[Student] = relationship(back_populates="grades")
    subject: Mapped[Subject] = relationship()


class AchievementLevel(Base):
    __tablename__ = "achievement_levels"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(8), unique=True)
    score: Mapped[float] = mapped_column(Float)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class CertificateType(Base):
    __tablename__ = "certificate_types"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(128), unique=True)
    points: Mapped[float] = mapped_column(Float)


class StudentCertificate(Base):
    __tablename__ = "student_certificates"
    __table_args__ = (UniqueConstraint("student_id", "certificate_type_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    certificate_type_id: Mapped[int] = mapped_column(ForeignKey("certificate_types.id"))

    student: Mapped[Student] = relationship(back_populates="certificates")
    certificate_type: Mapped[CertificateType] = relationship()


class AttendanceScoreRule(Base):
    __tablename__ = "attendance_score_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    absence_days: Mapped[int] = mapped_column(Integer, unique=True)
    score: Mapped[float] = mapped_column(Float)


class VolunteerConfig(Base):
    __tablename__ = "volunteer_config"

    id: Mapped[int] = mapped_column(primary_key=True)
    base_points: Mapped[float] = mapped_column(Float, default=18)
    required_hours: Mapped[float] = mapped_column(Float, default=30)
    min_hours_floor: Mapped[float] = mapped_column(Float, default=15)
    penalty_per_hour: Mapped[float] = mapped_column(Float, default=0.5)


class AdmissionType(Base):
    __tablename__ = "admission_types"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[AdmissionTypeCode] = mapped_column(Enum(AdmissionTypeCode), unique=True)
    name: Mapped[str] = mapped_column(String(64))

    config: Mapped["AdmissionTypeConfig"] = relationship(back_populates="admission_type", uselist=False)


class AdmissionTypeConfig(Base):
    __tablename__ = "admission_type_configs"

    id: Mapped[int] = mapped_column(primary_key=True)
    admission_type_id: Mapped[int] = mapped_column(ForeignKey("admission_types.id"), unique=True)

    # 교과 성적 산출식 계수
    subject_score_max: Mapped[float] = mapped_column(Float)
    subject_base_score: Mapped[float] = mapped_column(Float)
    coef_y2: Mapped[float] = mapped_column(Float)
    coef_y3: Mapped[float] = mapped_column(Float)
    info_weight_multiplier: Mapped[float] = mapped_column(Float, default=0.5)

    # 1단계 배점
    attendance_max: Mapped[float] = mapped_column(Float, default=18)
    service_max: Mapped[float] = mapped_column(Float, default=18)
    bonus_max: Mapped[float] = mapped_column(Float, default=4)
    stage1_total: Mapped[float] = mapped_column(Float)

    # 2단계 배점
    stage2_interview_max: Mapped[float] = mapped_column(Float)
    stage2_coding_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    stage2_aptitude_max: Mapped[float] = mapped_column(Float)
    stage2_total: Mapped[float] = mapped_column(Float)

    total_max: Mapped[float] = mapped_column(Float, default=400)

    admission_type: Mapped[AdmissionType] = relationship(back_populates="config")


class Stage2Score(Base):
    __tablename__ = "stage2_scores"
    __table_args__ = (UniqueConstraint("student_id", "admission_type_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    admission_type_id: Mapped[int] = mapped_column(ForeignKey("admission_types.id"))
    interview_score: Mapped[float] = mapped_column(Float, default=0)
    coding_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    aptitude_score: Mapped[float] = mapped_column(Float, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student: Mapped[Student] = relationship(back_populates="stage2_scores")
    admission_type: Mapped[AdmissionType] = relationship()
