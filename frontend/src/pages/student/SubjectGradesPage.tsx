import { useEffect, useMemo, useState } from "react";
import { deleteGrade, getAchievementLevels, getMyGrades, getSubjects, upsertGrade } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import type { AchievementLevel, Subject, SubjectGrade } from "../../api/types";

const SLOTS: { year: number; semester: number; label: string }[] = [
  { year: 1, semester: 1, label: "1학년 1학기" },
  { year: 1, semester: 2, label: "1학년 2학기" },
  { year: 2, semester: 1, label: "2학년 1학기" },
  { year: 2, semester: 2, label: "2학년 2학기" },
  { year: 3, semester: 1, label: "3학년 1학기" },
];

export default function SubjectGradesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels] = useState<AchievementLevel[]>([]);
  const [grades, setGrades] = useState<SubjectGrade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, { subjectId: string; code: string }>>({});

  function load() {
    Promise.all([getSubjects(), getAchievementLevels(), getMyGrades()])
      .then(([subj, lvl, g]) => {
        setSubjects(subj);
        setLevels(lvl);
        setGrades(g);
      })
      .catch((err) => setError(apiErrorMessage(err)));
  }

  useEffect(load, []);

  const gradesBySlot = useMemo(() => {
    const map = new Map<string, SubjectGrade[]>();
    for (const g of grades) {
      const key = `${g.year}-${g.semester}`;
      map.set(key, [...(map.get(key) ?? []), g]);
    }
    return map;
  }, [grades]);

  const subjectName = (id: number) => subjects.find((s) => s.id === id)?.name ?? "?";

  async function handleAdd(year: number, semester: number) {
    const key = `${year}-${semester}`;
    const draft = pending[key];
    if (!draft?.subjectId || !draft?.code) return;
    try {
      await upsertGrade({ subject_id: Number(draft.subjectId), year, semester, achievement_code: draft.code });
      setPending((p) => ({ ...p, [key]: { subjectId: "", code: "" } }));
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteGrade(id);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  if (error) return <p className="error-text">{error}</p>;

  return (
    <div>
      <h2 className="page-title">교과 성적 입력</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        수학 과목은 자동으로 2배 가중치가 적용됩니다. 일부 학기/학년 성적이 없으면 규정에 따라 자동으로 대체됩니다.
      </p>
      {SLOTS.map(({ year, semester, label }) => {
        const key = `${year}-${semester}`;
        const rows = gradesBySlot.get(key) ?? [];
        const usedSubjectIds = new Set(rows.map((r) => r.subject_id));
        const draft = pending[key] ?? { subjectId: "", code: "" };
        return (
          <div className="card" key={key}>
            <h2>{label}</h2>
            <table>
              <thead>
                <tr>
                  <th>과목</th>
                  <th>성취도</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((g) => (
                  <tr key={g.id}>
                    <td>
                      {subjectName(g.subject_id)}
                      {subjects.find((s) => s.id === g.subject_id)?.is_math && <span className="tag">수학</span>}
                      {subjects.find((s) => s.id === g.subject_id)?.is_informatics && <span className="tag">정보</span>}
                    </td>
                    <td>{g.achievement_code}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.id)}>
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="muted">
                      입력된 성적이 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="form-inline" style={{ marginTop: "0.9rem" }}>
              <div className="form-row" style={{ marginBottom: 0 }}>
                <label>과목</label>
                <select
                  value={draft.subjectId}
                  onChange={(e) => setPending((p) => ({ ...p, [key]: { ...draft, subjectId: e.target.value } }))}
                >
                  <option value="">선택</option>
                  {subjects
                    .filter((s) => !usedSubjectIds.has(s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-row" style={{ marginBottom: 0 }}>
                <label>성취도</label>
                <select
                  value={draft.code}
                  onChange={(e) => setPending((p) => ({ ...p, [key]: { ...draft, code: e.target.value } }))}
                >
                  <option value="">선택</option>
                  {levels.map((l) => (
                    <option key={l.id} value={l.code}>
                      {l.code}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn btn-sm" onClick={() => handleAdd(year, semester)}>
                추가
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
