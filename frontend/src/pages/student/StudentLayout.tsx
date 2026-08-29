import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const NAV_ITEMS = [
  { to: "/student", label: "대시보드", end: true },
  { to: "/student/grades", label: "교과 성적" },
  { to: "/student/attendance", label: "출결" },
  { to: "/student/volunteer", label: "봉사활동" },
  { to: "/student/certificates", label: "자격증/가산점" },
];

export default function StudentLayout() {
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
          <h1>마이스터고 입학전형 성적 산출</h1>
        </div>
        <div className="topbar-user">
          <span>{auth?.name ?? auth?.username}님</span>
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
