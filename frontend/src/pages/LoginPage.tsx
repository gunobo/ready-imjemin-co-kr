import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiErrorMessage } from "../api/client";
import { GoogleLoginButton } from "../components/GoogleLoginButton";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [showAdmin, setShowAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAdminSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const state = await login(username, password);
      navigate(state.role === "admin" ? "/admin" : "/student", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleCredential(idToken: string) {
    setError(null);
    try {
      const state = await loginWithGoogle(idToken);
      navigate(state.role === "admin" ? "/admin" : "/student", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark" />
          <span style={{ fontWeight: 800, fontSize: "1.05rem" }}>ready.imjemin.co.kr</span>
        </div>
        <h1>마이스터고 입학전형 성적 산출</h1>
        <p className="muted">교과 · 출결 · 봉사활동 · 가산점을 한 번에</p>

        {!showAdmin && (
          <>
            <div style={{ display: "flex", justifyContent: "center", margin: "0.5rem 0 1rem" }}>
              <GoogleLoginButton onCredential={handleGoogleCredential} />
            </div>
            {error && <p className="error-text">{error}</p>}
            <p className="muted" style={{ textAlign: "center", marginTop: "1.2rem" }}>
              관리자이신가요?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowAdmin(true);
                  setError(null);
                }}
              >
                아이디로 로그인
              </a>
            </p>
          </>
        )}

        {showAdmin && (
          <form onSubmit={handleAdminSubmit}>
            <div className="form-row">
              <label htmlFor="username">아이디</label>
              <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
            </div>
            <div className="form-row">
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="btn" type="submit" disabled={loading} style={{ width: "100%", marginTop: "0.5rem" }}>
              {loading ? "로그인 중..." : "로그인"}
            </button>
            <p className="muted" style={{ textAlign: "center", marginTop: "1rem" }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowAdmin(false);
                  setError(null);
                }}
              >
                학생이신가요? 구글로 로그인
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
