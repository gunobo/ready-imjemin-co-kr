import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const NAV_ITEMS = [
  { to: "/admin", label: "학생 계정", end: true },
  { to: "/admin/subjects", label: "과목 관리" },
  { to: "/admin/achievement-levels", label: "성취도 환산표" },
  { to: "/admin/certificate-types", label: "자격증/가산점 종류" },
  { to: "/admin/attendance-rules", label: "출결 배점표" },
  { to: "/admin/volunteer-config", label: "봉사활동 기준" },
  { to: "/admin/admission-types", label: "전형별 배점/계수" },
];

export default function AdminLayout() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" />
          <h1>관리자 · ready.imjemin.co.kr</h1>
        </div>
        <div className="topbar-user">
          <span>{auth?.username}</span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </header>
      <div className="layout">
        <nav className="sidebar">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
