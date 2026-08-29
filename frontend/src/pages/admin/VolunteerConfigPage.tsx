import { useEffect, useState } from "react";
import { adminGetVolunteerConfig, adminUpdateVolunteerConfig } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";

export default function VolunteerConfigPage() {
  const [basePoints, setBasePoints] = useState(18);
  const [requiredHours, setRequiredHours] = useState(30);
  const [minHoursFloor, setMinHoursFloor] = useState(15);
  const [penaltyPerHour, setPenaltyPerHour] = useState(0.5);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminGetVolunteerConfig()
      .then((c) => {
        setBasePoints(c.base_points);
        setRequiredHours(c.required_hours);
        setMinHoursFloor(c.min_hours_floor);
        setPenaltyPerHour(c.penalty_per_hour);
      })
      .catch((err) => setError(apiErrorMessage(err)));
  }, []);

  async function handleSave() {
    setError(null);
    setSaved(false);
    try {
      await adminUpdateVolunteerConfig({
        base_points: basePoints,
        required_hours: requiredHours,
        min_hours_floor: minHoursFloor,
        penalty_per_hour: penaltyPerHour,
      });
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <h2 className="page-title">봉사활동 성적 기준</h2>
      <div className="card">
        <h2>산출 기준</h2>
        <p className="muted">
          기준시간 미만 시 시간당 감점, 최저시간 미만은 0점 부여. (기준: hours ≥ 기준시간 → 만점, hours &lt; 최저시간 →
          0점, 그 사이 → 만점 - (기준시간-hours)×시간당감점)
        </p>
        <div className="grid-2">
          <div className="form-row">
            <label>만점 (base_points)</label>
            <input type="number" value={basePoints} onChange={(e) => setBasePoints(Number(e.target.value))} />
          </div>
          <div className="form-row">
            <label>기준시간 (required_hours)</label>
            <input type="number" value={requiredHours} onChange={(e) => setRequiredHours(Number(e.target.value))} />
          </div>
          <div className="form-row">
            <label>최저시간 (min_hours_floor, 미만이면 0점)</label>
            <input type="number" value={minHoursFloor} onChange={(e) => setMinHoursFloor(Number(e.target.value))} />
          </div>
          <div className="form-row">
            <label>시간당 감점 (penalty_per_hour)</label>
            <input
              type="number"
              step={0.1}
              value={penaltyPerHour}
              onChange={(e) => setPenaltyPerHour(Number(e.target.value))}
            />
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn" onClick={handleSave}>
          저장
        </button>
        {saved && <span className="muted" style={{ marginLeft: "0.75rem" }}>저장되었습니다</span>}
      </div>
    </div>
  );
}
