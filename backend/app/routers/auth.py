from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Role, Student, User
from app.schemas import ChangePasswordRequest, LoginRequest, TokenResponse
from app.security import create_access_token, hash_password, verify_password

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
