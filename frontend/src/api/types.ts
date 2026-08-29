export type Role = "admin" | "student";
export type AdmissionTypeCode = "meister" | "social" | "general";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: Role;
  student_id: number | null;
  username: string;
  name: string | null;
}

export interface Subject {
  id: number;
  name: string;
  is_math: boolean;
  is_informatics: boolean;
}

export interface AchievementLevel {
  id: number;
  code: string;
  score: number;
  sort_order: number;
}

export interface CertificateType {
  id: number;
  name: string;
  points: number;
}

export interface AttendanceScoreRule {
  id: number;
  absence_days: number;
  score: number;
}

export interface VolunteerConfig {
  id: number;
  base_points: number;
  required_hours: number;
  min_hours_floor: number;
  penalty_per_hour: number;
}

export interface AdmissionTypeConfig {
  id: number;
  subject_score_max: number;
  subject_base_score: number;
  coef_y2: number;
  coef_y3: number;
  info_weight_multiplier: number;
  attendance_max: number;
  service_max: number;
  bonus_max: number;
  stage1_total: number;
  stage2_interview_max: number;
  stage2_coding_max: number | null;
  stage2_aptitude_max: number;
  stage2_total: number;
  total_max: number;
}

export interface AdmissionType {
  id: number;
  code: AdmissionTypeCode;
  name: string;
  config: AdmissionTypeConfig;
}

export interface Student {
  id: number;
  name: string;
  no_attendance_record: boolean;
  absence_days: number;
  volunteer_hours: number;
  username: string;
}

export interface SubjectGrade {
  id: number;
  subject_id: number;
  year: number;
  semester: number;
  achievement_code: string;
}

export interface Stage2Score {
  id: number;
  admission_type_id: number;
  interview_score: number;
  coding_score: number | null;
  aptitude_score: number;
}

export interface SubjectScoreBreakdown {
  s21: number;
  n21: number;
  s22: number;
  n22: number;
  s31: number;
  n31: number;
  info_weight: number;
  substitutions_applied: string[];
  subject_score: number;
}

export interface Stage1Breakdown {
  subject: SubjectScoreBreakdown;
  attendance_score: number;
  volunteer_score: number;
  bonus_score: number;
  stage1_total: number;
}

export interface Stage2Breakdown {
  interview_score: number;
  coding_score: number | null;
  aptitude_score: number;
  stage2_total: number;
}

export interface AdmissionScoreResult {
  admission_type_code: AdmissionTypeCode;
  admission_type_name: string;
  stage1: Stage1Breakdown;
  stage2: Stage2Breakdown;
  total_score: number;
  total_max: number;
}
