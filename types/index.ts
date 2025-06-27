export interface Subject {
  id: string;
  name: string;
  credits: number;
  grade: number | null; // null nếu chưa có điểm
  expectedGrade?: number; // điểm mong muốn
}

export interface Semester {
  id: string;
  name: string;
  subjects: Subject[];
  gpa: number;
}

export interface StudentRecord {
  id: string;
  studentName: string;
  semesters: Semester[];
  cumulativeGPA: number;
  totalCredits: number;
  completedCredits: number;
}

export interface GPAScale {
  A: number;
  B_PLUS: number;
  B: number;
  C_PLUS: number;
  C: number;
  D_PLUS: number;
  D: number;
  F: number;
}

export interface AcademicLevel {
  level: 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Trung bình' | 'Yếu' | 'Kém';
  minGPA: number;
  maxGPA: number;
  color: string;
}

export interface ScholarshipRequirement {
  name: string;
  minGPA: number;
  description: string;
} 