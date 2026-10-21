export interface Student {
  id: number;
  name: string;
  age: number;
  email: string;
  departmentId?: number;
}

export interface Department {
  id: number;
  name: string;
}

export interface Subject {
  id: number;
  name: string;
}

export interface StudentSubject {
  studentId: number;
  subjectId: number;
}
