import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models import Role, Student, User
from app.schemas import ChangePasswordRequest, GoogleLoginRequest, LoginRequest, TokenResponse
from app.security import create_access_token, hash_password, verify_password
from app.services.google_auth import verify_google_id_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.username == payload.username).first()
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "아이디 또는 비밀번호가 올바르지 않습니다")

    student_id = None
    name = None
    if user.role == Role.student:
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if student is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "학생 프로필을 찾을 수 없습니다")
        student_id = student.id
        name = student.name

    token = create_access_token(subject=str(user.id), role=user.role.value, student_id=student_id)
    return TokenResponse(
        access_token=token,
        role=user.role,
        student_id=student_id,
        username=user.username,
        name=name,
    )


@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    if not settings.google_client_id:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "구글 로그인이 아직 설정되지 않았습니다")
    try:
        claims = verify_google_id_token(payload.id_token)
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "구글 인증에 실패했습니다")

    if not claims.get("email_verified"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "이메일이 인증된 구글 계정만 사용할 수 있습니다")

    email = claims["email"]
    name = claims.get("name") or email.split("@")[0]

    user = db.query(User).filter(User.username == email).first()
    if user is None:
        user = User(username=email, password_hash=hash_password(secrets.token_urlsafe(32)), role=Role.student)
        db.add(user)
        db.flush()
        db.add(Student(user_id=user.id, name=name))
        db.commit()
        db.refresh(user)
    elif user.role != Role.student:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "이 계정은 구글 로그인을 사용할 수 없습니다")
    elif not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "비활성화된 계정입니다")

    student = db.query(Student).filter(Student.user_id == user.id).first()
    token = create_access_token(subject=str(user.id), role=user.role.value, student_id=student.id)
    return TokenResponse(access_token=token, role=user.role, student_id=student.id, username=user.username, name=student.name)


@router.get("/me", response_model=TokenResponse)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> TokenResponse:
    student_id = None
    name = None
    if user.role == Role.student:
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if student:
            student_id = student.id
            name = student.name
    token = create_access_token(subject=str(user.id), role=user.role.value, student_id=student_id)
    return TokenResponse(access_token=token, role=user.role, student_id=student_id, username=user.username, name=name)


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "현재 비밀번호가 올바르지 않습니다")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"ok": True}
