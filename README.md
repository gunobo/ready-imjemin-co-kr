# ready.imjemin.co.kr

마이스터고 입학전형(마이스터인재전형/사회통합전형/일반전형) 성적 산출 웹사이트.

- `backend/` — FastAPI + SQLAlchemy + SQLite
- `frontend/` — React + TypeScript (Vite)

관리자가 과목/성취도 환산표/자격증(가산점)/출결 배점표/봉사활동 기준/전형별 배점과 계수를 관리하고, 학생은 관리자가 생성한 계정으로 로그인해 본인의 교과 성적·출결·봉사활동·자격증을 입력하면 전형별 예상 점수가 자동으로 산출됩니다.

## 로컬 개발

### 백엔드

```bash
cd backend
cp .env.example .env  # 없다면 아래 값들을 직접 채운 .env 생성
uv run uvicorn app.main:app --reload --port 8099
```

### 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

`vite.config.ts`의 dev 서버 프록시가 `/api`를 `http://127.0.0.1:8099`로 전달합니다.

### 테스트

```bash
cd backend
uv run pytest
```

## 배포

`docker-compose.yml`로 backend/frontend/cloudflared 3개 컨테이너를 구동합니다. 라즈베리파이 배포 절차는 [DEPLOY.md](DEPLOY.md)를 참고하세요.

```bash
cp .env.example .env  # 값 채우기
docker compose up -d --build
```
