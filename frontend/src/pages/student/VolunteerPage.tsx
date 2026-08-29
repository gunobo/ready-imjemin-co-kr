import { useEffect, useState, type FormEvent } from "react";
import { getMyProfile, getMyScores, updateVolunteer } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";

export default function VolunteerPage() {
  const [hours, setHours] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);

  useEffect(() => {
    getMyProfile()
      .then((p) => setHours(p.volunteer_hours))
      .catch(() => {});
    getMyScores()
      .then((scores) => {
        if (scores[0]) setCurrentScore(scores[0].stage1.volunteer_score);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await updateVolunteer({ volunteer_hours: hours });
      const scores = await getMyScores();
      if (scores[0]) setCurrentScore(scores[0].stage1.volunteer_score);
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <h2 className="page-title">봉사활동 입력</h2>
      <div className="card">
        <h2>누적 봉사활동 시간</h2>
        <p className="muted">
          3개년 합산 30시간 기준(18점 만점), 미달 시 시간당 0.5점 감점, 15시간 미만은 0점입니다. 산출 기준일은
          2024.3.1.~2026.9.30.입니다.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-row" style={{ maxWidth: 200 }}>
            <label htmlFor="hours">봉사활동 시간</label>
            <input
              id="hours"
              type="number"
              min={0}
              step={0.5}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn" type="submit">
            저장
          </button>
          {saved && currentScore !== null && (
            <span className="muted" style={{ marginLeft: "0.75rem" }}>
              저장됨 — 봉사활동 성적: {currentScore}점
            </span>
          )}
        </form>
      </div>
    </div>
  );
}
