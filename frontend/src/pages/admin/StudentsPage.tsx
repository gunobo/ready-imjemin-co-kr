import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminCreateStudent, adminDeleteStudent, adminListStudents, adminResetPassword } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import type { Student } from "../../api/types";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  function load() {
    adminListStudents()
      .then(setStudents)
      .catch((err) => setError(apiErrorMessage(err)));
  }

  useEffect(load, []);

  async function handleCreate() {
    if (!username.trim() || !password.trim() || !name.trim()) return;
    try {
      await adminCreateStudent({ username: username.trim(), password, name: name.trim() });
      setUsername("");
      setPassword("");
      setName("");
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleReset(id: number) {
    const newPassword = prompt("새 비밀번호를 입력하세요");
    if (!newPassword) return;
    try {
      await adminResetPassword(id, newPassword);
      alert("비밀번호가 초기화되었습니다");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("정말 이 학생 계정을 삭제할까요? 입력된 성적도 함께 삭제됩니다.")) return;
    try {
      await adminDeleteStudent(id);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <h2 className="page-title">학생 계정 관리</h2>
      <div className="card">
        <h2>학생 목록</h2>
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>아이디</th>
              <th>결석일수</th>
              <th>봉사시간</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link to={`/admin/students/${s.id}`}>{s.name}</Link>
                </td>
                <td>{s.username}</td>
                <td>{s.no_attendance_record ? "미인정 없음(14점)" : `${s.absence_days}일`}</td>
                <td>{s.volunteer_hours}시간</td>
                <td style={{ display: "flex", gap: "0.4rem" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleReset(s.id)}>
                    비번 초기화
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  등록된 학생이 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="form-inline" style={{ marginTop: "1rem" }}>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>이름</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>아이디</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>초기 비밀번호</label>
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-sm" onClick={handleCreate}>
            계정 생성
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
