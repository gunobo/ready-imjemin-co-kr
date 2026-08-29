import { useEffect, useMemo, useState } from "react";
import { deleteGrade, getAchievementLevels, getMyGrades, getSubjects, upsertGrade } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import type { AchievementLevel, Subject, SubjectGrade } from "../../api/types";

const SLOTS: { year: number; semester: number; label: string }[] = [
  { year: 1, semester: 1, label: "1-1" },
  { year: 1, semester: 2, label: "1-2" },
  { year: 2, semester: 1, label: "2-1" },
  { year: 2, semester: 2, label: "2-2" },
  { year: 3, semester: 1, label: "3-1" },
];

function cellKey(subjectId: number, year: number, semester: number) {
  return `${subjectId}:${year}:${semester}`;
}

export default function SubjectGradesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [validCodes, setValidCodes] = useState<Set<string>>(new Set(["A", "B", "C", "D", "E"]));
  const [existing, setExisting] = useState<Record<string, SubjectGrade>>({});
  const [grid, setGrid] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function load() {
    Promise.all([getSubjects(), getAchievementLevels(), getMyGrades()])
      .then(([subj, levels, grades]) => {
        setSubjects(subj);
        setValidCodes(new Set(levels.map((l: AchievementLevel) => l.code.toUpperCase())));
        const existingMap: Record<string, SubjectGrade> = {};
        const gridMap: Record<string, string> = {};
        for (const g of grades) {
          const key = cellKey(g.subject_id, g.year, g.semester);
          existingMap[key] = g;
          gridMap[key] = g.achievement_code.toUpperCase();
        }
        setExisting(existingMap);
        setGrid(gridMap);
      })
      .catch((err) => setError(apiErrorMessage(err)));
  }

  useEffect(load, []);

  const sortedCodes = useMemo(() => Array.from(validCodes).sort(), [validCodes]);

  function handleCellChange(key: string, raw: string) {
    const cleaned = raw.toUpperCase().replace(/[^A-E]/g, "").slice(-1);
    setGrid((prev) => ({ ...prev, [key]: cleaned }));
    setSaved(false);
  }

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const tasks: Promise<unknown>[] = [];
      for (const subject of subjects) {
        for (const slot of SLOTS) {
          const key = cellKey(subject.id, slot.year, slot.semester);
          const value = (grid[key] ?? "").trim();
          const existingGrade = existing[key];

          if (value === "") {
            if (existingGrade) tasks.push(deleteGrade(existingGrade.id));
            continue;
          }
          if (!validCodes.has(value)) continue;
          if (existingGrade && existingGrade.achievement_code.toUpperCase() === value) continue;

          tasks.push(
            upsertGrade({ subject_id: subject.id, year: slot.year, semester: slot.semester, achievement_code: value }),
          );
        }
      }
      await Promise.all(tasks);
      load();
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p className="error-text">{error}</p>;

  return (
    <div>
      <h2 className="page-title">교과 성적 입력</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        칸에 성취도({sortedCodes.join(", ")})를 입력하세요. 대소문자 구분 없이 입력 가능하며, 비워두면 해당 학기 성적이
        삭제됩니다. 수학 과목은 자동으로 2배 가중치가 적용되고, 일부 학기/학년 성적이 없으면 규정에 따라 자동으로
        대체됩니다.
      </p>
      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>과목</th>
                {SLOTS.map((slot) => (
                  <th key={slot.label} style={{ textAlign: "center" }}>
                    {slot.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id}>
                  <td>
                    {subject.name}
                    {subject.is_math && <span className="tag">수학</span>}
                    {subject.is_informatics && <span className="tag">정보</span>}
                  </td>
                  {SLOTS.map((slot) => {
                    const key = cellKey(subject.id, slot.year, slot.semester);
                    return (
                      <td key={key}>
                        <input
                          value={grid[key] ?? ""}
                          onChange={(e) => handleCellChange(key, e.target.value)}
                          maxLength={1}
                          style={{ width: 44, textAlign: "center", textTransform: "uppercase" }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={SLOTS.length + 1} className="muted">
                    등록된 과목이 없습니다. 관리자에게 문의하세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <button className="btn" style={{ marginTop: "1.1rem" }} onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </button>
        {saved && <span className="muted" style={{ marginLeft: "0.75rem" }}>저장되었습니다</span>}
      </div>
    </div>
  );
}
