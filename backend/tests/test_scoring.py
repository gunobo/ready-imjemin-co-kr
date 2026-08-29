from app.services.scoring import (
    GradeEntry,
    compute_attendance_score,
    compute_bonus_score,
    compute_subject_score,
    compute_volunteer_score,
)

FORMULA_KW = dict(
    subject_base_score=45.5,
    coef_y2=2.88,
    coef_y3=8.64,  # 4.32 x 2 (already combined)
    info_weight_multiplier=0.5,
    subject_score_max=120,
    fallback_informatics_score=3,  # "C" 환산점 가정
)


def test_normal_case_all_semesters_present():
    grades = [
        GradeEntry(year=2, semester=1, score=5, is_informatics=False),
        GradeEntry(year=2, semester=2, score=5, is_informatics=False),
        GradeEntry(year=3, semester=1, score=5, is_informatics=False),
        GradeEntry(year=1, semester=1, score=4, is_informatics=True),
    ]
    result = compute_subject_score(grades, **FORMULA_KW)
    assert result.s21 == 5 and result.n21 == 1
    assert result.s22 == 5 and result.n22 == 1
    assert result.s31 == 5 and result.n31 == 1
    assert result.info_weight == 2.0  # 4 * 0.5
    # 45.5 + 2.88*(5+5) + 8.64*5 + 2 = 119.5
    assert result.subject_score == 119.5
    assert result.substitutions_applied == []


def test_math_subject_is_double_weighted():
    grades = [
        GradeEntry(year=2, semester=1, score=4, is_math=True),
        GradeEntry(year=2, semester=1, score=5, is_math=False),
        GradeEntry(year=2, semester=2, score=5),
        GradeEntry(year=3, semester=1, score=5),
    ]
    result = compute_subject_score(grades, **FORMULA_KW)
    # math: score*2=8, count=2; plus non-math score=5,count=1 -> s21=13, n21=3
    assert result.s21 == 13
    assert result.n21 == 3


def test_semester1_missing_falls_back_to_semester2():
    grades = [
        GradeEntry(year=2, semester=2, score=4),
        GradeEntry(year=3, semester=1, score=5),
    ]
    result = compute_subject_score(grades, **FORMULA_KW)
    assert result.s21 == 4 and result.n21 == 1  # substituted from sem2
    assert result.s22 == 4 and result.n22 == 1
    assert any("2학기 성적 반영" in n for n in result.substitutions_applied)


def test_semester2_missing_falls_back_to_semester1():
    grades = [
        GradeEntry(year=2, semester=1, score=4),
        GradeEntry(year=3, semester=1, score=5),
    ]
    result = compute_subject_score(grades, **FORMULA_KW)
    assert result.s22 == 4 and result.n22 == 1
    assert any("1학기 성적 반영" in n for n in result.substitutions_applied)


def test_year2_missing_falls_back_to_year3_semester1():
    grades = [
        GradeEntry(year=3, semester=1, score=6),
    ]
    result = compute_subject_score(grades, **FORMULA_KW)
    assert result.s21 == 6 and result.n21 == 1
    assert result.s22 == 6 and result.n22 == 1
    assert result.s31 == 6 and result.n31 == 1
    assert any("2학년 교과 성적 없음" in n for n in result.substitutions_applied)


def test_year3_missing_falls_back_to_year2_semester1():
    grades = [
        GradeEntry(year=2, semester=1, score=4),
        GradeEntry(year=2, semester=2, score=6),
    ]
    result = compute_subject_score(grades, **FORMULA_KW)
    assert result.s31 == 4 and result.n31 == 1  # uses year2 semester1 (not substituted)
    assert any("3학년 교과 성적 없음" in n for n in result.substitutions_applied)


def test_year2_and_year3_missing_falls_back_to_year1():
    grades = [
        GradeEntry(year=1, semester=1, score=3),
        GradeEntry(year=1, semester=2, score=5),
    ]
    result = compute_subject_score(grades, **FORMULA_KW)
    assert result.s21 == 3 and result.n21 == 1  # from 1-1
    assert result.s22 == 5 and result.n22 == 1  # from 1-2
    assert result.s31 == 3 and result.n31 == 1  # from 1-1
    assert any("2,3학년 교과 성적 없음" in n for n in result.substitutions_applied)


def test_informatics_missing_uses_c_fallback():
    grades = [GradeEntry(year=2, semester=1, score=5)]
    result = compute_subject_score(grades, **FORMULA_KW)
    assert result.info_weight == 1.5  # fallback 3 * 0.5
    assert any("정보 교과 성적 없음" in n for n in result.substitutions_applied)


def test_subject_score_is_clamped_to_max():
    grades = [
        GradeEntry(year=2, semester=1, score=100),
        GradeEntry(year=2, semester=2, score=100),
        GradeEntry(year=3, semester=1, score=100),
    ]
    result = compute_subject_score(grades, **FORMULA_KW)
    assert result.subject_score == 120


def test_attendance_score_table_lookup():
    table = {0: 18, 1: 17, 15: 3}
    assert compute_attendance_score(no_attendance_record=False, absence_days=0, attendance_table=table) == 18
    assert compute_attendance_score(no_attendance_record=False, absence_days=16, attendance_table=table) == 0
    assert compute_attendance_score(no_attendance_record=True, absence_days=100, attendance_table=table) == 14


def test_volunteer_score_formula():
    kw = dict(base_points=18, required_hours=30, min_hours_floor=15, penalty_per_hour=0.5)
    assert compute_volunteer_score(volunteer_hours=30, **kw) == 18
    assert compute_volunteer_score(volunteer_hours=40, **kw) == 18
    assert compute_volunteer_score(volunteer_hours=14, **kw) == 0
    # 30 - 20 = 10 hours short -> 18 - 10*0.5 = 13
    assert compute_volunteer_score(volunteer_hours=20, **kw) == 13


def test_bonus_score_capped():
    assert compute_bonus_score(certificate_points=[2, 2, 2], bonus_max=4) == 4
    assert compute_bonus_score(certificate_points=[1, 1], bonus_max=4) == 2
