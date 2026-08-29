import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminDeleteStudent, adminListStudents } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import type { Student } from "../../api/types";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);

  function load() {
    adminListStudents()
      .then(setStudents)
      .catch((err) => setError(apiErrorMessage(err)));
  }

  useEffect(load, []);

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
      <h2 className="page-title">학생 계정</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        학생은 구글 계정으로 로그인하면 자동으로 가입됩니다. 아래는 지금까지 가입한 학생 목록입니다.
      </p>
      <div className="card">
        <h2>학생 목록</h2>
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>구글 계정</th>
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
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  아직 가입한 학생이 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
