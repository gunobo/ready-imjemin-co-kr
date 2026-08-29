import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  adminGetStage2Scores,
  adminGetStudentScores,
  adminListAdmissionTypes,
  adminUpsertStage2Score,
} from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import type { AdmissionScoreResult, AdmissionType, Stage2Score } from "../../api/types";

export default function StudentDetailPage() {
  const { id } = useParams();
  const studentId = Number(id);
  const [scores, setScores] = useState<AdmissionScoreResult[]>([]);
  const [admissionTypes, setAdmissionTypes] = useState<AdmissionType[]>([]);
  const [stage2Map, setStage2Map] = useState<Record<number, { interview: number; coding: number | null; aptitude: number }>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [savedTypeId, setSavedTypeId] = useState<number | null>(null);

  function load() {
    Promise.all([adminGetStudentScores(studentId), adminListAdmissionTypes(), adminGetStage2Scores(studentId)])
      .then(([sc, types, s2]) => {
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
  if (!scores.length) return <p className="muted">불러오는 중...</p>;

  return (
    <div>
      <h2 className="page-title">학생 성적 상세</h2>
      <div className="grid-3">
        {scores.map((s) => {
          const at = admissionTypes.find((t) => t.code === s.admission_type_code);
          const draft = at ? stage2Map[at.id] : undefined;
          return (
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
              </div>
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
