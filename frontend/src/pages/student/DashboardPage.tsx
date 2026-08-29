import { useEffect, useState } from "react";
import { getMyScores } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import type { AdmissionScoreResult } from "../../api/types";

export default function DashboardPage() {
  const [scores, setScores] = useState<AdmissionScoreResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyScores()
      .then(setScores)
      .catch((err) => setError(apiErrorMessage(err)));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!scores) return <p className="muted">불러오는 중...</p>;

  return (
    <div>
      <h2 className="page-title">전형별 예상 점수</h2>
      <div className="grid-3">
        {scores.map((s) => (
          <div className="card" key={s.admission_type_code}>
            <h2>{s.admission_type_name}</h2>
            <div className="score-hero">
              <span className="value">{s.total_score}</span>
              <span className="max">/ {s.total_max}점</span>
            </div>
            <div className="breakdown-list" style={{ marginTop: "1rem" }}>
              <div className="row">
                <span>교과 성적</span>
                <span>{s.stage1.subject.subject_score}</span>
              </div>
              <div className="row">
                <span>출결 성적</span>
                <span>{s.stage1.attendance_score}</span>
              </div>
              <div className="row">
                <span>봉사활동 성적</span>
                <span>{s.stage1.volunteer_score}</span>
              </div>
              <div className="row">
                <span>가산점</span>
                <span>{s.stage1.bonus_score}</span>
              </div>
              <div className="row">
                <strong>1단계 합계</strong>
                <strong>{s.stage1.stage1_total}</strong>
              </div>
              <div className="row">
                <span>심층면접</span>
                <span>{s.stage2.interview_score}</span>
              </div>
              {s.stage2.coding_score !== null && (
                <div className="row">
                  <span>코딩테스트</span>
                  <span>{s.stage2.coding_score}</span>
                </div>
              )}
              <div className="row">
                <span>직무적성소양평가</span>
                <span>{s.stage2.aptitude_score}</span>
              </div>
              <div className="row">
                <strong>2단계 합계</strong>
                <strong>{s.stage2.stage2_total}</strong>
              </div>
            </div>
            {s.stage1.subject.substitutions_applied.length > 0 && (
              <div className="substitution-note">
                {s.stage1.subject.substitutions_applied.map((note, i) => (
                  <div key={i}>· {note}</div>
                ))}
              </div>
            )}
            <p className="muted" style={{ marginTop: "0.75rem" }}>
              ※ 2단계 심층면접/직무적성소양평가 점수는 학교 평가 후 관리자가 입력합니다.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
