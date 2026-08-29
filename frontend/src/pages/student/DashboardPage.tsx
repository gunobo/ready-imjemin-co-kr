import { useEffect, useState } from "react";
import { getMyScores } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import type { AdmissionScoreResult, AdmissionTypeCode } from "../../api/types";
import { ScoreGauge } from "../../components/ScoreGauge";
import { StackBar } from "../../components/StackBar";

const THEME: Record<AdmissionTypeCode, { solid: string; className: string }> = {
  meister: { solid: "var(--color-meister)", className: "meister" },
  social: { solid: "var(--color-social)", className: "social" },
  general: { solid: "var(--color-general)", className: "general" },
};

const CATEGORY_COLORS = {
  subject: "#5b3df5",
  attendance: "#0ea5e9",
  volunteer: "#f59e0b",
  bonus: "#ec4899",
};

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
        {scores.map((s) => {
          const theme = THEME[s.admission_type_code];
          return (
            <div className={`card admission-card ${theme.className}`} key={s.admission_type_code}>
              <div className="gauge-row">
                <ScoreGauge value={s.total_score} max={s.total_max} color={theme.solid} />
                <div className="gauge-meta">
                  <div className="name">{s.admission_type_name}</div>
                  <div className="score-line">
                    총점 <strong>{s.total_score}</strong> / {s.total_max}
                  </div>
                  <div className="score-line">1단계 {s.stage1.stage1_total} · 2단계 {s.stage2.stage2_total}</div>
                </div>
              </div>

              <StackBar
                segments={[
                  { label: "교과", value: s.stage1.subject.subject_score, color: CATEGORY_COLORS.subject },
                  { label: "출결", value: s.stage1.attendance_score, color: CATEGORY_COLORS.attendance },
                  { label: "봉사", value: s.stage1.volunteer_score, color: CATEGORY_COLORS.volunteer },
                  { label: "가산점", value: s.stage1.bonus_score, color: CATEGORY_COLORS.bonus },
                ]}
              />

              <div className="breakdown-list">
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
          );
        })}
      </div>
    </div>
  );
}
