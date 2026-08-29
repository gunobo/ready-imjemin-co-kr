# 라즈베리파이 배포 가이드 (ready.imjemin.co.kr)

라즈베리파이(`gunoboserver10`)에 SSH로 접속한 상태에서 아래 순서대로 진행하세요.

## 1. 저장소 클론

```bash
cd ~
git clone https://github.com/gunobo/ready-imjemin-co-kr.git
cd ready-imjemin-co-kr
```

## 2. 환경변수 설정

```bash
cp .env.example .env
nano .env
```

`.env`에 아래 값을 채웁니다.

- `JWT_SECRET`: 임의의 긴 무작위 문자열 (예: `openssl rand -hex 32`로 생성)
- `ADMIN_INITIAL_USERNAME`: 관리자 아이디 (기본 `admin`)
- `ADMIN_INITIAL_PASSWORD`: 관리자 초기 비밀번호
- `CLOUDFLARE_TUNNEL_TOKEN`: 아래 3단계에서 발급받은 토큰

> `.env`는 git에 커밋되지 않습니다(`.gitignore`에 포함). 관리자 비밀번호는 최초 컨테이너 기동 시 1회만 DB에 시딩되므로, 이후 비밀번호 변경은 관리자 화면(로그인 후 비밀번호 변경) 또는 DB를 초기화한 뒤 다시 기동해야 반영됩니다.

## 3. Cloudflare Tunnel 생성 및 라우팅

1. [Cloudflare Zero Trust 대시보드](https://one.dash.cloudflare.com/) → **Networks → Tunnels → Create a tunnel**
2. 이름을 `ready-imjemin` 등으로 지정하고 생성
3. **Docker** 환경을 선택하면 `--token <TOKEN>` 형태의 토큰이 표시됩니다 — 이 토큰 값을 `.env`의 `CLOUDFLARE_TUNNEL_TOKEN`에 붙여넣으세요
4. **Public Hostname** 탭에서 추가:
   - Subdomain: `ready`
   - Domain: `imjemin.co.kr`
   - Service Type: `HTTP`
   - URL: `frontend:80` (docker-compose 네트워크 내부에서 frontend 컨테이너로 직접 연결)

## 4. 빌드 및 기동

```bash
docker compose up -d --build
docker compose ps
```

`ready-backend`, `ready-frontend`, `ready-cloudflared` 3개 컨테이너가 모두 `Up` 상태인지 확인합니다. 다른 프로젝트와 포트가 겹치지 않도록 프론트는 호스트 `5105`, 백엔드는 호스트 `8008`로 매핑되어 있습니다(직접 접속 테스트용, Cloudflare Tunnel은 컨테이너 네트워크로 바로 붙습니다).

## 5. 동작 확인

```bash
curl -s http://localhost:5105/api/health
```

`{"status":"ok"}`가 나오면 정상입니다. 이후 브라우저에서 https://ready.imjemin.co.kr 접속 후 `admin` 계정으로 로그인해 관리자 화면이 뜨는지 확인하세요.

## 업데이트 배포

```bash
cd ~/ready-imjemin-co-kr
git pull
docker compose up -d --build
```

SQLite 데이터는 `ready_db`라는 named volume에 저장되므로 재빌드/재기동해도 유지됩니다.

## 로그 확인

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f cloudflared
```

## 데이터 백업

```bash
docker run --rm -v ready-imjemin-co-kr_ready_db:/data -v $(pwd):/backup alpine \
  tar czf /backup/ready-db-backup-$(date +%Y%m%d).tar.gz -C /data .
```
