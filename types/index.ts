export interface Subject {
  id: string;
  name: string;
  credits: number;
  grade: number | null; // null nếu chưa có điểm
  expectedGrade?: number; // điểm mong muốn
  
  // Thông tin chi tiết môn học
  courseCode?: string; // mã môn học
  instructor?: string; // giảng viên
  semester?: string; // học kỳ cụ thể (HK1/2022-2023)
  courseType?: 'required' | 'elective' | 'major' | 'general'; // loại môn
  department?: string; // khoa/bộ môn
  
  // Điểm chi tiết
  processGrade?: number; // điểm quá trình
  midtermGrade?: number; // điểm giữa kỳ  
  finalGrade?: number; // điểm cuối kỳ
  attendanceGrade?: number; // điểm chuyên cần
  
  // Thông tin bổ sung
  difficulty?: 1 | 2 | 3 | 4 | 5; // độ khó (1-5)
  importance?: 1 | 2 | 3 | 4 | 5; // độ quan trọng (1-5)
  prerequisites?: string[]; // môn tiên quyết
  notes?: string; // ghi chú
  studyTime?: number; // số giờ học/tuần
  labHours?: number; // số tiết thực hành
  theoryHours?: number; // số tiết lý thuyết
  
  // Thời khóa biểu
  schedule?: ClassSchedule[];
}

export interface Semester {
  id: string;
  name: string;
  subjects: Subject[];
  gpa: number;
}

export interface GPAScale {
  A_PLUS: number;
  A: number;
  B_PLUS: number;
  B: number;
  C_PLUS: number;
  C: number;
  D_PLUS: number;
  D: number;
  F: number;
}

export interface GPASettings {
  scale: GPAScale;
  gradeRanges: {
    A_PLUS: { min: number; max: number };
    A: { min: number; max: number };
    B_PLUS: { min: number; max: number };
    B: { min: number; max: number };
    C_PLUS: { min: number; max: number };
    C: { min: number; max: number };
    D_PLUS: { min: number; max: number };
    D: { min: number; max: number };
    F: { min: number; max: number };
  };
  maxGPA: number; // Thang điểm tối đa (4.0, 4.3, etc.)
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

export interface StudentRecord {
  id: string;
  studentName: string;
  semesters: Semester[];
  cumulativeGPA: number;
  totalCredits: number;
  completedCredits: number;
  gpaSettings?: GPASettings; // Cấu hình thang đo tùy chỉnh
}

export interface ClassSchedule {
  id: string;
  subjectId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
  startTime: string; // "08:00"
  endTime: string; // "10:00"
  room: string; // "A101"
  building?: string; // "Tòa nhà A"
  instructor?: string; // "TS. Nguyễn Văn A"
  type: 'lecture' | 'lab' | 'tutorial' | 'exam'; // loại tiết học
  weeks?: number[]; // các tuần học [1,2,3,...,16]
  note?: string; // ghi chú
}

export interface TimeSlot {
  period: number; // tiết thứ mấy (1-12)
  startTime: string;
  endTime: string;
}

export interface WeekSchedule {
  [key: number]: ClassSchedule[]; // key = dayOfWeek (0-6)
} 