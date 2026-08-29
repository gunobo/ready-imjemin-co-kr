import { useEffect, useState, type FormEvent } from "react";
import { getMyProfile, getMyScores, updateAttendance } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";

export default function AttendancePage() {
  const [absenceDays, setAbsenceDays] = useState(0);
  const [noRecord, setNoRecord] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);

  useEffect(() => {
    getMyProfile()
      .then((p) => {
        setAbsenceDays(p.absence_days);
        setNoRecord(p.no_attendance_record);
      })
      .catch(() => {});
    getMyScores()
      .then((scores) => {
        if (scores[0]) setCurrentScore(scores[0].stage1.attendance_score);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await updateAttendance({ absence_days: absenceDays, no_attendance_record: noRecord });
      const scores = await getMyScores();
      if (scores[0]) setCurrentScore(scores[0].stage1.attendance_score);
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <h2 className="page-title">출결 입력</h2>
      <div className="card">
        <h2>미인정 결석일수</h2>
        <p className="muted">3개 학년의 미인정 결석일수와 환산 결석일수를 합산하여 입력하세요.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              <input type="checkbox" checked={noRecord} onChange={(e) => setNoRecord(e.target.checked)} /> 검정고시
              합격자/조기진급/재취학/해외귀국/조기졸업 등 출결 성적이 없는 경우 (14점 고정 부여)
            </label>
          </div>
          {!noRecord && (
            <div className="form-row" style={{ maxWidth: 200 }}>
              <label htmlFor="absence">결석일수</label>
              <input
                id="absence"
                type="number"
                min={0}
                value={absenceDays}
                onChange={(e) => setAbsenceDays(Number(e.target.value))}
              />
            </div>
          )}
          {error && <p className="error-text">{error}</p>}
          <button className="btn" type="submit">
            저장
          </button>
          {saved && currentScore !== null && (
            <span className="muted" style={{ marginLeft: "0.75rem" }}>
              저장됨 — 출석 성적: {currentScore}점
            </span>
          )}
        </form>
      </div>
    </div>
  );
}
