import { useEffect, useState } from "react";
import { getCertificateTypes, getMyCertificates, getMyScores, setMyCertificates } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import type { CertificateType } from "../../api/types";

export default function CertificatesPage() {
  const [types, setTypes] = useState<CertificateType[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);

  function load() {
    Promise.all([getCertificateTypes(), getMyCertificates()])
      .then(([t, mine]) => {
        setTypes(t);
        setSelected(new Set(mine));
      })
      .catch((err) => setError(apiErrorMessage(err)));
    getMyScores()
      .then((scores) => {
        if (scores[0]) setCurrentScore(scores[0].stage1.bonus_score);
      })
      .catch(() => {});
  }

  useEffect(load, []);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await setMyCertificates(Array.from(selected));
      const scores = await getMyScores();
      if (scores[0]) setCurrentScore(scores[0].stage1.bonus_score);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="page-title">자격증/가산점</h2>
      <div className="card">
        <h2>보유 자격증 선택</h2>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>자격증</th>
              <th>배점</th>
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.id}>
                <td>
                  <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} />
                </td>
                <td>{t.name}</td>
                <td>{t.points}점</td>
              </tr>
            ))}
            {types.length === 0 && (
              <tr>
                <td colSpan={3} className="muted">
                  등록된 자격증 종류가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {error && <p className="error-text">{error}</p>}
        <button className="btn" style={{ marginTop: "1rem" }} onClick={handleSave} disabled={saving}>
          저장
        </button>
        {currentScore !== null && (
          <span className="muted" style={{ marginLeft: "0.75rem" }}>
            현재 가산점: {currentScore}점 (전형별 배점 상한 적용)
          </span>
        )}
      </div>
    </div>
  );
}
