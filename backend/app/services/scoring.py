"""마이스터고 입학전형 성적 산출 엔진.

전형별 산출식(교과/출결/봉사/가산점/2단계)을 순수 함수로 구현한다.
DB 세션에 의존하지 않는 순수 계산 로직만 두어 pytest로 독립 검증 가능하게 한다.
"""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class GradeEntry:
    year: int  # 1, 2, 3
    semester: int  # 1, 2 (3학년은 1학기만 사용)
    score: float  # 성취도 환산 점수 (이미 A/B/C.. -> 점수 변환된 값)
    is_math: bool = False
    is_informatics: bool = False


@dataclass
class SemesterAgg:
    """한 학기의 (S, N) 집계값. 수학 과목은 점수/과목수 모두 2배로 반영됨."""

    total_score: float = 0.0
    count: float = 0.0
    has_any: bool = False

    def add(self, score: float, is_math: bool) -> None:
        weight = 2 if is_math else 1
        self.total_score += score * weight
        self.count += weight
        self.has_any = True


def _aggregate_by_semester(grades: list[GradeEntry]) -> dict[tuple[int, int], SemesterAgg]:
    slots: dict[tuple[int, int], SemesterAgg] = {
        (1, 1): SemesterAgg(),
        (1, 2): SemesterAgg(),
        (2, 1): SemesterAgg(),
        (2, 2): SemesterAgg(),
        (3, 1): SemesterAgg(),
    }
    for g in grades:
        key = (g.year, g.semester)
        if key in slots:
            slots[key].add(g.score, g.is_math)
    return slots


def _within_year_substitute(
    sem1: SemesterAgg, sem2: SemesterAgg
) -> tuple[SemesterAgg | None, SemesterAgg | None, list[str]]:
    """동일 학년 내 1학기/2학기 중 한쪽만 없는 경우 반대 학기 성적으로 대체."""
    notes: list[str] = []
    if sem1.has_any and sem2.has_any:
        return sem1, sem2, notes
    if sem1.has_any and not sem2.has_any:
        notes.append("2학기 교과 성적 없음 -> 1학기 성적 반영")
        return sem1, sem1, notes
    if sem2.has_any and not sem1.has_any:
        notes.append("1학기 교과 성적 없음 -> 2학기 성적 반영")
        return sem2, sem2, notes
    return None, None, notes


@dataclass
class SubjectScoreResult:
    s21: float
    n21: float
    s22: float
    n22: float
    s31: float
    n31: float
    info_weight: float
    substitutions_applied: list[str] = field(default_factory=list)
    subject_score: float = 0.0


def compute_subject_score(
    grades: list[GradeEntry],
    *,
    subject_base_score: float,
    coef_y2: float,
    coef_y3: float,
    info_weight_multiplier: float,
    subject_score_max: float,
    fallback_informatics_score: float,
) -> SubjectScoreResult:
    slots = _aggregate_by_semester(grades)
    notes: list[str] = []

    y2_missing = not slots[(2, 1)].has_any and not slots[(2, 2)].has_any
    y3_missing = not slots[(3, 1)].has_any

    # 1학년은 2,3학년이 모두 없을 때만 대체 소스로 쓰이므로 우선 자체적으로 학기 대체를 해둔다.
    eff_1_1, eff_1_2, y1_notes = _within_year_substitute(slots[(1, 1)], slots[(1, 2)])

    if y2_missing and y3_missing:
        notes.append("2,3학년 교과 성적 없음 -> 1학년 성적 반영")
        eff_2_1 = eff_1_1 or SemesterAgg()
        eff_2_2 = eff_1_2 or SemesterAgg()
        eff_3_1 = eff_1_1 or SemesterAgg()
    elif y2_missing:
        notes.append("2학년 교과 성적 없음 -> 3학년 1학기 성적을 2학년 1,2학기에 반영")
        eff_3_1 = slots[(3, 1)]
        eff_2_1 = eff_3_1
        eff_2_2 = eff_3_1
    elif y3_missing:
        eff_2_1, eff_2_2, y2_notes = _within_year_substitute(slots[(2, 1)], slots[(2, 2)])
        notes.extend(y2_notes)
        eff_2_1 = eff_2_1 or SemesterAgg()
        eff_2_2 = eff_2_2 or SemesterAgg()
        notes.append("3학년 교과 성적 없음 -> 2학년 1학기 성적을 3학년 1학기에 반영")
        eff_3_1 = eff_2_1
    else:
        eff_2_1, eff_2_2, y2_notes = _within_year_substitute(slots[(2, 1)], slots[(2, 2)])
        notes.extend(y2_notes)
        eff_2_1 = eff_2_1 or SemesterAgg()
        eff_2_2 = eff_2_2 or SemesterAgg()
        eff_3_1 = slots[(3, 1)]

    s21, n21 = eff_2_1.total_score, eff_2_1.count
    s22, n22 = eff_2_2.total_score, eff_2_2.count
    s31, n31 = eff_3_1.total_score, eff_3_1.count

    info_scores = [g.score for g in grades if g.is_informatics]
    if info_scores:
        info_weight = (sum(info_scores) / len(info_scores)) * info_weight_multiplier
    else:
        notes.append("정보 교과 성적 없음 -> C로 환산하여 가중치 산출")
        info_weight = fallback_informatics_score * info_weight_multiplier

    def safe_ratio(s: float, n: float) -> float:
        return (s / n) if n else 0.0

    raw = (
        subject_base_score
        + coef_y2 * (safe_ratio(s21, n21) + safe_ratio(s22, n22))
        + coef_y3 * safe_ratio(s31, n31)
        + info_weight
    )
    subject_score = max(0.0, min(raw, subject_score_max))

    return SubjectScoreResult(
        s21=s21,
        n21=n21,
        s22=s22,
        n22=n22,
        s31=s31,
        n31=n31,
        info_weight=info_weight,
        substitutions_applied=notes,
        subject_score=round(subject_score, 3),
    )


def compute_attendance_score(
    *,
    no_attendance_record: bool,
    absence_days: int,
    attendance_table: dict[int, float],
    no_record_score: float = 14.0,
) -> float:
    if no_attendance_record:
        return no_record_score
    if absence_days in attendance_table:
        return attendance_table[absence_days]
    if absence_days > max(attendance_table.keys(), default=0):
        return 0.0
    # 표에 없는 음수 등 방어적 처리
    return 0.0


def compute_volunteer_score(
    *,
    volunteer_hours: float,
    base_points: float,
    required_hours: float,
    min_hours_floor: float,
    penalty_per_hour: float,
) -> float:
    if volunteer_hours >= required_hours:
        return base_points
    if volunteer_hours < min_hours_floor:
        return 0.0
    shortfall = required_hours - volunteer_hours
    score = base_points - shortfall * penalty_per_hour
    return round(max(0.0, score))


def compute_bonus_score(*, certificate_points: list[float], bonus_max: float) -> float:
    return min(sum(certificate_points), bonus_max)
