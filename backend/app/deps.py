from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Role, Student, User
from app.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "인증이 필요합니다")
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "유효하지 않은 토큰입니다")
    user = db.get(User, int(payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "사용자를 찾을 수 없습니다")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != Role.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "관리자만 접근할 수 있습니다")
    return user


def require_student(user: User = Depends(get_current_user)) -> User:
    if user.role != Role.student:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "학생만 접근할 수 있습니다")
    return user


def get_current_student(
    user: User = Depends(require_student),
    db: Session = Depends(get_db),
) -> Student:
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "학생 프로필을 찾을 수 없습니다")
    return student
