import { useEffect, useState } from "react";
import {
  adminCreateAchievementLevel,
  adminDeleteAchievementLevel,
  adminListAchievementLevels,
  adminUpdateAchievementLevel,
} from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import type { AchievementLevel } from "../../api/types";

export default function AchievementLevelsPage() {
  const [levels, setLevels] = useState<AchievementLevel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [score, setScore] = useState(0);
  const [sortOrder, setSortOrder] = useState(0);

  function load() {
    adminListAchievementLevels()
      .then(setLevels)
      .catch((err) => setError(apiErrorMessage(err)));
  }

  useEffect(load, []);

  async function handleCreate() {
    if (!code.trim()) return;
    try {
      await adminCreateAchievementLevel({ code: code.trim(), score, sort_order: sortOrder });
      setCode("");
      setScore(0);
      setSortOrder(0);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleUpdateScore(l: AchievementLevel, newScore: number) {
    try {
      await adminUpdateAchievementLevel(l.id, { code: l.code, score: newScore, sort_order: l.sort_order });
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleDelete(id: number) {
    try {
      await adminDeleteAchievementLevel(id);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <h2 className="page-title">성취도 환산표</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        A/B/C 등 성취도를 교과 성적 산출식에 사용할 점수로 환산합니다. "C" 코드는 정보 교과 성적이 없는 학생의 대체값으로도
        쓰이므로 반드시 등록되어 있어야 합니다.
      </p>
      <div className="card">
        <h2>환산표</h2>
        <table>
          <thead>
            <tr>
              <th>코드</th>
              <th>환산 점수</th>
              <th>정렬 순서</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {levels.map((l) => (
              <tr key={l.id}>
                <td>{l.code}</td>
                <td>
                  <input
                    type="number"
                    style={{ width: 90 }}
                    value={l.score}
                    onChange={(e) => handleUpdateScore(l, Number(e.target.value))}
                  />
                </td>
                <td>{l.sort_order}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(l.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="form-inline" style={{ marginTop: "1rem" }}>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>코드</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} style={{ width: 80 }} placeholder="A" />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>환산 점수</label>
            <input type="number" value={score} onChange={(e) => setScore(Number(e.target.value))} style={{ width: 100 }} />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>정렬 순서</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              style={{ width: 100 }}
            />
          </div>
          <button className="btn btn-sm" onClick={handleCreate}>
            추가
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
