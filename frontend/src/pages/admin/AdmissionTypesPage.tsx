import { useEffect, useState } from "react";
import { adminListAdmissionTypes, adminUpdateAdmissionTypeConfig } from "../../api/endpoints";
import { apiErrorMessage } from "../../api/client";
import type { AdmissionType, AdmissionTypeConfig } from "../../api/types";

const FIELD_LABELS: { key: keyof AdmissionTypeConfig; label: string; nullable?: boolean }[] = [
  { key: "subject_score_max", label: "교과 성적 만점" },
  { key: "subject_base_score", label: "교과 산출식 기본점수" },
  { key: "coef_y2", label: "2학년 계수 (coef_y2)" },
  { key: "coef_y3", label: "3학년 계수 (coef_y3, x2 포함)" },
  { key: "info_weight_multiplier", label: "정보교과 가중치 배수" },
  { key: "attendance_max", label: "출결 만점" },
  { key: "service_max", label: "봉사활동 만점" },
  { key: "bonus_max", label: "가산점 만점" },
  { key: "stage1_total", label: "1단계 합계" },
  { key: "stage2_interview_max", label: "심층면접 만점" },
  { key: "stage2_coding_max", label: "코딩테스트 만점 (해당 없으면 비움)", nullable: true },
  { key: "stage2_aptitude_max", label: "직무적성소양평가 만점" },
  { key: "stage2_total", label: "2단계 합계" },
  { key: "total_max", label: "총점" },
];

export default function AdmissionTypesPage() {
  const [types, setTypes] = useState<AdmissionType[]>([]);
  const [drafts, setDrafts] = useState<Record<number, AdmissionTypeConfig>>({});
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  function load() {
    adminListAdmissionTypes()
      .then((data) => {
        setTypes(data);
        setDrafts(Object.fromEntries(data.map((t) => [t.id, { ...t.config }])));
      })
      .catch((err) => setError(apiErrorMessage(err)));
  }

  useEffect(load, []);

  function updateField(typeId: number, key: keyof AdmissionTypeConfig, value: number | null) {
    setDrafts((prev) => ({ ...prev, [typeId]: { ...prev[typeId], [key]: value } }));
  }

  async function handleSave(typeId: number) {
    setError(null);
    setSavedId(null);
    try {
      const { id: _id, ...payload } = drafts[typeId];
      await adminUpdateAdmissionTypeConfig(typeId, payload);
      setSavedId(typeId);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <h2 className="page-title">전형별 배점 및 산출식 계수</h2>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        교과 성적 산출식: 만점 = 기본점수 + coef_y2×(S21/N21 + S22/N22) + coef_y3×(S31/N31) + 정보교과가중치. coef_y3에는
        원본 산출식의 ×2가 이미 포함된 값을 입력하세요 (예: 4.32×2 → 8.64).
      </p>
      {types.map((t) => {
        const draft = drafts[t.id];
        if (!draft) return null;
        return (
          <div className="card" key={t.id}>
            <h2>{t.name}</h2>
            <div className="grid-3">
              {FIELD_LABELS.map(({ key, label, nullable }) => (
                <div className="form-row" key={key}>
                  <label>{label}</label>
                  <input
                    type="number"
                    step={0.01}
                    value={draft[key] ?? ""}
                    placeholder={nullable ? "미해당" : undefined}
                    onChange={(e) =>
                      updateField(t.id, key, e.target.value === "" ? (nullable ? null : 0) : Number(e.target.value))
                    }
                  />
                </div>
              ))}
            </div>
            <button className="btn" onClick={() => handleSave(t.id)}>
              저장
            </button>
            {savedId === t.id && <span className="muted" style={{ marginLeft: "0.75rem" }}>저장되었습니다</span>}
          </div>
        );
      })}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
