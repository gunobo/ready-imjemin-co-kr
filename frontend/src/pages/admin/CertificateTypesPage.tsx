import { useEffect, useState } from "react";
import {
  adminCreateCertificateType,
  adminDeleteCertificateType,
  adminListCertificateTypes,
  adminUpdateCertificateType,
} from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import type { CertificateType } from "../../api/types";

export default function CertificateTypesPage() {
  const [types, setTypes] = useState<CertificateType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [points, setPoints] = useState(0);

  function load() {
    adminListCertificateTypes()
      .then(setTypes)
      .catch((err) => setError(apiErrorMessage(err)));
  }

  useEffect(load, []);

  async function handleCreate() {
    if (!name.trim()) return;
    try {
      await adminCreateCertificateType({ name: name.trim(), points });
      setName("");
      setPoints(0);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleUpdatePoints(t: CertificateType, newPoints: number) {
    try {
      await adminUpdateCertificateType(t.id, { name: t.name, points: newPoints });
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleDelete(id: number) {
    try {
      await adminDeleteCertificateType(id);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <h2 className="page-title">자격증/가산점 종류</h2>
      <div className="card">
        <h2>목록</h2>
        <table>
          <thead>
            <tr>
              <th>자격증명</th>
              <th>배점</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>
                  <input
                    type="number"
                    step={0.5}
                    style={{ width: 90 }}
                    value={t.points}
                    onChange={(e) => handleUpdatePoints(t, Number(e.target.value))}
                  />
                </td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="form-inline" style={{ marginTop: "1rem" }}>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>자격증명</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 정보처리기능사" />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>배점</label>
            <input type="number" step={0.5} value={points} onChange={(e) => setPoints(Number(e.target.value))} style={{ width: 100 }} />
          </div>
          <button className="btn btn-sm" onClick={handleCreate}>
            추가
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
