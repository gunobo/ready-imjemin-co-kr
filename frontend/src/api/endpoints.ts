import { apiClient } from "./client";
import type {
  AchievementLevel,
  AdmissionScoreResult,
  AdmissionType,
  AdmissionTypeConfig,
  AttendanceScoreRule,
  CertificateType,
  Stage2Score,
  Student,
  Subject,
  SubjectGrade,
  TokenResponse,
  VolunteerConfig,
} from "./types";

// ---- auth ----
export const login = (username: string, password: string) =>
  apiClient.post<TokenResponse>("/auth/login", { username, password }).then((r) => r.data);

export const googleLogin = (idToken: string) =>
  apiClient.post<TokenResponse>("/auth/google", { id_token: idToken }).then((r) => r.data);

export const changePassword = (current_password: string, new_password: string) =>
  apiClient.post("/auth/change-password", { current_password, new_password }).then((r) => r.data);

// ---- student self-service ----
export const getMyProfile = () => apiClient.get<Student>("/student/me").then((r) => r.data);
export const getSubjects = () => apiClient.get<Subject[]>("/student/subjects").then((r) => r.data);
export const getAchievementLevels = () =>
  apiClient.get<AchievementLevel[]>("/student/achievement-levels").then((r) => r.data);
export const getMyGrades = () => apiClient.get<SubjectGrade[]>("/student/grades").then((r) => r.data);
export const upsertGrade = (payload: { subject_id: number; year: number; semester: number; achievement_code: string }) =>
  apiClient.put<SubjectGrade>("/student/grades", payload).then((r) => r.data);
export const deleteGrade = (gradeId: number) => apiClient.delete(`/student/grades/${gradeId}`).then((r) => r.data);

export const updateAttendance = (payload: { absence_days: number; no_attendance_record: boolean }) =>
  apiClient.put("/student/attendance", payload).then((r) => r.data);

export const updateVolunteer = (payload: { volunteer_hours: number }) =>
  apiClient.put("/student/volunteer", payload).then((r) => r.data);

export const getCertificateTypes = () =>
  apiClient.get<CertificateType[]>("/student/certificate-types").then((r) => r.data);
export const getMyCertificates = () => apiClient.get<number[]>("/student/certificates").then((r) => r.data);
export const setMyCertificates = (certificate_type_ids: number[]) =>
  apiClient.put("/student/certificates", { certificate_type_ids }).then((r) => r.data);

export const getMyScores = () => apiClient.get<AdmissionScoreResult[]>("/students/me/scores").then((r) => r.data);

// ---- admin: students ----
export const adminListStudents = () => apiClient.get<Student[]>("/admin/students").then((r) => r.data);
export const adminGetStudent = (id: number) => apiClient.get<Student>(`/admin/students/${id}`).then((r) => r.data);
export const adminUpdateStudent = (id: number, payload: Partial<Pick<Student, "name" | "no_attendance_record" | "absence_days">>) =>
  apiClient.put<Student>(`/admin/students/${id}`, payload).then((r) => r.data);
export const adminDeleteStudent = (id: number) => apiClient.delete(`/admin/students/${id}`).then((r) => r.data);
export const adminGetStudentGrades = (id: number) =>
  apiClient.get<SubjectGrade[]>(`/admin/students/${id}/grades`).then((r) => r.data);
export const adminGetStudentScores = (id: number) =>
  apiClient.get<AdmissionScoreResult[]>(`/admin/students/${id}/scores`).then((r) => r.data);
export const adminGetStage2Scores = (id: number) =>
  apiClient.get<Stage2Score[]>(`/admin/students/${id}/stage2-scores`).then((r) => r.data);
export const adminUpsertStage2Score = (
  id: number,
  payload: { admission_type_id: number; interview_score: number; coding_score: number | null; aptitude_score: number },
) => apiClient.put<Stage2Score>(`/admin/students/${id}/stage2-scores`, payload).then((r) => r.data);

// ---- admin: reference data ----
export const adminListSubjects = () => apiClient.get<Subject[]>("/admin/subjects").then((r) => r.data);
export const adminCreateSubject = (payload: { name: string; is_math: boolean; is_informatics: boolean }) =>
  apiClient.post<Subject>("/admin/subjects", payload).then((r) => r.data);
export const adminUpdateSubject = (id: number, payload: { name: string; is_math: boolean; is_informatics: boolean }) =>
  apiClient.put<Subject>(`/admin/subjects/${id}`, payload).then((r) => r.data);
export const adminDeleteSubject = (id: number) => apiClient.delete(`/admin/subjects/${id}`).then((r) => r.data);

export const adminListAchievementLevels = () =>
  apiClient.get<AchievementLevel[]>("/admin/achievement-levels").then((r) => r.data);
export const adminCreateAchievementLevel = (payload: { code: string; score: number; sort_order: number }) =>
  apiClient.post<AchievementLevel>("/admin/achievement-levels", payload).then((r) => r.data);
export const adminUpdateAchievementLevel = (id: number, payload: { code: string; score: number; sort_order: number }) =>
  apiClient.put<AchievementLevel>(`/admin/achievement-levels/${id}`, payload).then((r) => r.data);
export const adminDeleteAchievementLevel = (id: number) =>
  apiClient.delete(`/admin/achievement-levels/${id}`).then((r) => r.data);

export const adminListCertificateTypes = () =>
  apiClient.get<CertificateType[]>("/admin/certificate-types").then((r) => r.data);
export const adminCreateCertificateType = (payload: { name: string; points: number }) =>
  apiClient.post<CertificateType>("/admin/certificate-types", payload).then((r) => r.data);
export const adminUpdateCertificateType = (id: number, payload: { name: string; points: number }) =>
  apiClient.put<CertificateType>(`/admin/certificate-types/${id}`, payload).then((r) => r.data);
export const adminDeleteCertificateType = (id: number) =>
  apiClient.delete(`/admin/certificate-types/${id}`).then((r) => r.data);

export const adminListAttendanceRules = () =>
  apiClient.get<AttendanceScoreRule[]>("/admin/attendance-rules").then((r) => r.data);
export const adminReplaceAttendanceRules = (rules: { absence_days: number; score: number }[]) =>
  apiClient.put<AttendanceScoreRule[]>("/admin/attendance-rules", rules).then((r) => r.data);

export const adminGetVolunteerConfig = () => apiClient.get<VolunteerConfig>("/admin/volunteer-config").then((r) => r.data);
export const adminUpdateVolunteerConfig = (payload: Omit<VolunteerConfig, "id">) =>
  apiClient.put<VolunteerConfig>("/admin/volunteer-config", payload).then((r) => r.data);

export const adminListAdmissionTypes = () => apiClient.get<AdmissionType[]>("/admin/admission-types").then((r) => r.data);
export const adminUpdateAdmissionTypeConfig = (id: number, payload: Omit<AdmissionTypeConfig, "id">) =>
  apiClient.put<AdmissionType>(`/admin/admission-types/${id}/config`, payload).then((r) => r.data);
