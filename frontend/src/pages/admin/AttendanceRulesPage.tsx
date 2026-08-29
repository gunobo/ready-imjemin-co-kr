import { useEffect, useState } from "react";
import { adminListAttendanceRules, adminReplaceAttendanceRules } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";

export default function AttendanceRulesPage() {
  const [rows, setRows] = useState<{ absence_days: number; score: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function load() {
    adminListAttendanceRules()
      .then((rules) => setRows(rules.map((r) => ({ absence_days: r.absence_days, score: r.score }))))
      .catch((err) => setError(apiErrorMessage(err)));
  }

  useEffect(load, []);

  function updateScore(days: number, score: number) {
    setRows((prev) => prev.map((r) => (r.absence_days === days ? { ...r, score } : r)));
  }

  function addRow() {
    const nextDay = rows.length ? Math.max(...rows.map((r) => r.absence_days)) + 1 : 0;
    setRows((prev) => [...prev, { absence_days: nextDay, score: 0 }].sort((a, b) => a.absence_days - b.absence_days));
  }

  function removeRow(days: number) {
    setRows((prev) => prev.filter((r) => r.absence_days !== days));
  }

  async function handleSave() {
    setError(null);
    setSaved(false);
    try {
      await adminReplaceAttendanceRules(rows);
      setSaved(true);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <h2 className="page-title">출결 배점표</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        표에 없는 결석일수(표의 최대값 초과)는 자동으로 0점 처리됩니다. 출결 성적이 없는 특수 케이스는 14점 고정으로 학생
        화면에서 별도 체크됩니다.
      </p>
      <div className="card">
        <h2>결석일수별 출석 성적</h2>
        <table>
          <thead>
            <tr>
              <th>결석일수</th>
              <th>출석 성적</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.absence_days}>
                <td>{r.absence_days}일</td>
                <td>
                  <input
                    type="number"
                    style={{ width: 90 }}
                    value={r.score}
                    onChange={(e) => updateScore(r.absence_days, Number(e.target.value))}
                  />
                </td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => removeRow(r.absence_days)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem" }}>
          <button className="btn btn-secondary btn-sm" onClick={addRow}>
            결석일수 행 추가
          </button>
          <button className="btn" onClick={handleSave}>
            저장
          </button>
          {saved && <span className="muted">저장되었습니다</span>}
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
