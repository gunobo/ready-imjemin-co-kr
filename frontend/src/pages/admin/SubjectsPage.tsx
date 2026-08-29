import { useEffect, useState } from "react";
import { adminCreateSubject, adminDeleteSubject, adminListSubjects, adminUpdateSubject } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import type { Subject } from "../../api/types";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [isMath, setIsMath] = useState(false);
  const [isInformatics, setIsInformatics] = useState(false);

  function load() {
    adminListSubjects()
      .then(setSubjects)
      .catch((err) => setError(apiErrorMessage(err)));
  }

  useEffect(load, []);

  async function handleCreate() {
    if (!name.trim()) return;
    try {
      await adminCreateSubject({ name: name.trim(), is_math: isMath, is_informatics: isInformatics });
      setName("");
      setIsMath(false);
      setIsInformatics(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function toggleFlag(s: Subject, field: "is_math" | "is_informatics") {
    try {
      await adminUpdateSubject(s.id, { name: s.name, is_math: s.is_math, is_informatics: s.is_informatics, [field]: !s[field] });
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleDelete(id: number) {
    try {
      await adminDeleteSubject(id);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <h2 className="page-title">과목 관리</h2>
      <div className="card">
        <h2>과목 목록</h2>
        <table>
          <thead>
            <tr>
              <th>과목명</th>
              <th>수학 (2배 가중치)</th>
              <th>정보 교과</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>
                  <input type="checkbox" checked={s.is_math} onChange={() => toggleFlag(s, "is_math")} />
                </td>
                <td>
                  <input type="checkbox" checked={s.is_informatics} onChange={() => toggleFlag(s, "is_informatics")} />
                </td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="form-inline" style={{ marginTop: "1rem" }}>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>과목명</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 수학" />
          </div>
          <label>
            <input type="checkbox" checked={isMath} onChange={(e) => setIsMath(e.target.checked)} /> 수학
          </label>
          <label>
            <input type="checkbox" checked={isInformatics} onChange={(e) => setIsInformatics(e.target.checked)} /> 정보
          </label>
          <button className="btn btn-sm" onClick={handleCreate}>
            추가
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
