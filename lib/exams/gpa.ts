export const GRADE_POINT_MAP: Record<string, number> = {
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'D': 1.0,
  'F': 0.0,
};

export interface CourseGradeInput {
  courseCode: string;
  grade: string;
  units?: number;
  academicYear?: string;
  semester?: number;
}

/**
 * Calculates unit-weighted GPA for a collection of course grade records.
 * Gracefully handles the zero-unit edge case by returning 0.00 instead of NaN.
 */
export function calculateWeightedGpa(courses: CourseGradeInput[]): number {
  if (!courses || courses.length === 0) {
    return 0.0;
  }

  let totalQualityPoints = 0;
  let totalUnits = 0;

  for (const course of courses) {
    const cleanGrade = (course.grade || '').trim().toUpperCase();
    const points = GRADE_POINT_MAP[cleanGrade] ?? 0.0;
    // Explicit units (even 0) take precedence; default to 3 if omitted
    const units = typeof course.units === 'number' ? course.units : 3;

    totalQualityPoints += points * units;
    totalUnits += units;
  }

  if (totalUnits === 0) {
    return 0.0;
  }

  const rawGpa = totalQualityPoints / totalUnits;
  return Math.round(rawGpa * 100) / 100;
}

/**
 * Calculates semester-by-semester and cumulative GPA trends across semesters.
 */
export function calculateGpaTrend(courses: CourseGradeInput[]): {
  semesterGpa: number;
  cumulativeGpa: number;
  totalUnits: number;
  history: Array<{
    semesterLabel: string;
    gpa: number;
    cgpa: number;
    units: number;
  }>;
} {
  if (!courses || courses.length === 0) {
    return {
      semesterGpa: 0.0,
      cumulativeGpa: 0.0,
      totalUnits: 0,
      history: [],
    };
  }

  // Group courses by semester
  const groups: Record<string, CourseGradeInput[]> = {};
  for (const c of courses) {
    const key = `${c.academicYear || '2026/2027'}-S${c.semester || 1}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }

  let runningPoints = 0;
  let runningUnits = 0;
  const history: Array<{
    semesterLabel: string;
    gpa: number;
    cgpa: number;
    units: number;
  }> = [];

  const sortedKeys = Object.keys(groups).sort();
  for (const key of sortedKeys) {
    const semesterCourses = groups[key];
    let semPoints = 0;
    let semUnits = 0;

    for (const c of semesterCourses) {
      const cleanGrade = (c.grade || '').trim().toUpperCase();
      const points = GRADE_POINT_MAP[cleanGrade] ?? 0.0;
      const units = typeof c.units === 'number' ? c.units : 3;

      semPoints += points * units;
      semUnits += units;
      runningPoints += points * units;
      runningUnits += units;
    }

    const semGpa = semUnits > 0 ? Math.round((semPoints / semUnits) * 100) / 100 : 0.0;
    const cgpa = runningUnits > 0 ? Math.round((runningPoints / runningUnits) * 100) / 100 : 0.0;

    history.push({
      semesterLabel: key.replace('-', ' '),
      gpa: semGpa,
      cgpa,
      units: semUnits,
    });
  }

  const last = history[history.length - 1];
  return {
    semesterGpa: last ? last.gpa : 0.0,
    cumulativeGpa: runningUnits > 0 ? Math.round((runningPoints / runningUnits) * 100) / 100 : 0.0,
    totalUnits: runningUnits,
    history,
  };
}
