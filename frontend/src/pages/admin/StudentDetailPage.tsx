import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  adminGetStage2Scores,
  adminGetStudent,
  adminGetStudentScores,
  adminListAdmissionTypes,
  adminUpdateStudent,
  adminUpsertStage2Score,
} from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import type { AdmissionScoreResult, AdmissionType, AdmissionTypeCode, Stage2Score, Student } from "../../api/types";
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

export default function StudentDetailPage() {
  const { id } = useParams();
  const studentId = Number(id);
  const [student, setStudent] = useState<Student | null>(null);
  const [scores, setScores] = useState<AdmissionScoreResult[]>([]);
  const [admissionTypes, setAdmissionTypes] = useState<AdmissionType[]>([]);
  const [stage2Map, setStage2Map] = useState<Record<number, { interview: number; coding: number | null; aptitude: number }>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [savedTypeId, setSavedTypeId] = useState<number | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [noAttendanceRecord, setNoAttendanceRecord] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  function load() {
    Promise.all([
      adminGetStudent(studentId),
      adminGetStudentScores(studentId),
      adminListAdmissionTypes(),
      adminGetStage2Scores(studentId),
    ])
      .then(([st, sc, types, s2]) => {
        setStudent(st);
        setNameDraft(st.name);
        setNoAttendanceRecord(st.no_attendance_record);
        setScores(sc);
        setAdmissionTypes(types);
        const map: Record<number, { interview: number; coding: number | null; aptitude: number }> = {};
        for (const t of types) {
          const existing = s2.find((x: Stage2Score) => x.admission_type_id === t.id);
          map[t.id] = {
            interview: existing?.interview_score ?? 0,
            coding: existing?.coding_score ?? (t.config.stage2_coding_max === null ? null : 0),
            aptitude: existing?.aptitude_score ?? 0,
          };
        }
        setStage2Map(map);
      })
      .catch((err) => setError(apiErrorMessage(err)));
  }

  useEffect(load, [studentId]);

  async function handleSaveProfile() {
    setError(null);
    setProfileSaved(false);
    try {
      await adminUpdateStudent(studentId, { name: nameDraft, no_attendance_record: noAttendanceRecord });
      setProfileSaved(true);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleSaveStage2(typeId: number) {
    setError(null);
    setSavedTypeId(null);
    const draft = stage2Map[typeId];
    try {
      await adminUpsertStage2Score(studentId, {
        admission_type_id: typeId,
        interview_score: draft.interview,
        coding_score: draft.coding,
        aptitude_score: draft.aptitude,
      });
      setSavedTypeId(typeId);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  if (error) return <p className="error-text">{error}</p>;
  if (!scores.length || !student) return <p className="muted">불러오는 중...</p>;

  return (
    <div>
      <h2 className="page-title">학생 성적 상세</h2>
      <div className="card">
        <h2>학생 정보</h2>
        <p className="muted" style={{ marginTop: "-0.4rem" }}>구글 계정: {student.username}</p>
        <div className="grid-2">
          <div className="form-row">
            <label>이름</label>
            <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
          </div>
          <div className="form-row">
            <label>출결 특수 케이스</label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 400 }}>
              <input
                type="checkbox"
                checked={noAttendanceRecord}
                onChange={(e) => setNoAttendanceRecord(e.target.checked)}
              />
              <span className="muted">출결 성적 없음 (14점 고정)</span>
            </label>
          </div>
        </div>
        <button className="btn btn-sm" onClick={handleSaveProfile}>
          저장
        </button>
        {profileSaved && <span className="muted" style={{ marginLeft: "0.6rem" }}>저장됨</span>}
      </div>
      <div className="grid-3">
        {scores.map((s) => {
          const at = admissionTypes.find((t) => t.code === s.admission_type_code);
          const draft = at ? stage2Map[at.id] : undefined;
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
              {s.stage1.subject.substitutions_applied.length > 0 && (
                <div className="substitution-note">
                  {s.stage1.subject.substitutions_applied.map((note, i) => (
                    <div key={i}>· {note}</div>
                  ))}
                </div>
              )}
              {at && draft && (
                <div style={{ marginTop: "1.1rem" }}>
                  <h2 style={{ fontSize: "0.92rem" }}>2단계 점수 입력</h2>
                  <div className="form-row">
                    <label>심층면접 (만점 {at.config.stage2_interview_max})</label>
                    <input
                      type="number"
                      value={draft.interview}
                      onChange={(e) =>
                        setStage2Map((prev) => ({
                          ...prev,
                          [at.id]: { ...prev[at.id], interview: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                  {at.config.stage2_coding_max !== null && (
                    <div className="form-row">
                      <label>코딩테스트 (만점 {at.config.stage2_coding_max})</label>
                      <input
                        type="number"
                        value={draft.coding ?? 0}
                        onChange={(e) =>
                          setStage2Map((prev) => ({
                            ...prev,
                            [at.id]: { ...prev[at.id], coding: Number(e.target.value) },
                          }))
                        }
                      />
                    </div>
                  )}
                  <div className="form-row">
                    <label>직무적성소양평가 (만점 {at.config.stage2_aptitude_max})</label>
                    <input
                      type="number"
                      value={draft.aptitude}
                      onChange={(e) =>
                        setStage2Map((prev) => ({
                          ...prev,
                          [at.id]: { ...prev[at.id], aptitude: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                  <button className="btn btn-sm" onClick={() => handleSaveStage2(at.id)}>
                    저장
                  </button>
                  {savedTypeId === at.id && <span className="muted" style={{ marginLeft: "0.6rem" }}>저장됨</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
