export interface OverviewStats {
  students: number;
  departments: number;
  subjects: number;
  enrollments: number;
}

export interface DepartmentCount {
  department: string;
  count: number;
}

export interface EnrollmentPerStudent {
  studentId: number;
  enrollmentCount: number;
}

export interface DepartmentBreakdownRow {
  name: string;
  studentCount: number;
  share: number;
  enrollments: number;
  avgEnrollmentsPerStudent: number;
}
