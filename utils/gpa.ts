import { Subject, Semester, StudentRecord, GPAScale, GPASettings, AcademicLevel, ScholarshipRequirement } from '@/types';

// Thang điểm 4.0 mặc định - Cập nhật theo yêu cầu mới
export const DEFAULT_GPA_SCALE: GPAScale = {
  A_PLUS: 4.0,   // 9.0-10.0
  A: 3.7,        // 8.5-8.9
  B_PLUS: 3.3,   // 8.0-8.4
  B: 3.0,        // 7.0-7.9
  C_PLUS: 2.3,   // 6.5-6.9
  C: 2.0,        // 5.5-6.4
  D_PLUS: 1.3,   // 5.0-5.4
  D: 1.0,        // 4.0-4.9
  F: 0.0,        // 0-3.9
};

// Cấu hình thang đo mặc định
export const DEFAULT_GPA_SETTINGS: GPASettings = {
  scale: DEFAULT_GPA_SCALE,
  gradeRanges: {
    A_PLUS: { min: 9.0, max: 10.0 },
    A: { min: 8.5, max: 8.9 },
    B_PLUS: { min: 8.0, max: 8.4 },
    B: { min: 7.0, max: 7.9 },
    C_PLUS: { min: 6.5, max: 6.9 },
    C: { min: 5.5, max: 6.4 },
    D_PLUS: { min: 5.0, max: 5.4 },
    D: { min: 4.0, max: 4.9 },
    F: { min: 0, max: 3.9 },
  },
  maxGPA: 4.0
};

// Các thang đo phổ biến
export const PRESET_GPA_SETTINGS: { [key: string]: GPASettings } = {
  'vn-4.0': DEFAULT_GPA_SETTINGS,
  'us-4.0': {
    scale: { A_PLUS: 4.0, A: 4.0, B_PLUS: 3.3, B: 3.0, C_PLUS: 2.3, C: 2.0, D_PLUS: 1.3, D: 1.0, F: 0.0 },
    gradeRanges: {
      A_PLUS: { min: 9.7, max: 10.0 },
      A: { min: 9.3, max: 9.6 },
      B_PLUS: { min: 8.7, max: 9.2 },
      B: { min: 8.3, max: 8.6 },
      C_PLUS: { min: 7.7, max: 8.2 },
      C: { min: 7.3, max: 7.6 },
      D_PLUS: { min: 6.7, max: 7.2 },
      D: { min: 6.0, max: 6.6 },
      F: { min: 0, max: 5.9 },
    },
    maxGPA: 4.0
  },
  'us-4.3': {
    scale: { A_PLUS: 4.3, A: 4.0, B_PLUS: 3.3, B: 3.0, C_PLUS: 2.3, C: 2.0, D_PLUS: 1.3, D: 1.0, F: 0.0 },
    gradeRanges: {
      A_PLUS: { min: 9.7, max: 10.0 },
      A: { min: 9.3, max: 9.6 },
      B_PLUS: { min: 8.7, max: 9.2 },
      B: { min: 8.3, max: 8.6 },
      C_PLUS: { min: 7.7, max: 8.2 },
      C: { min: 7.3, max: 7.6 },
      D_PLUS: { min: 6.7, max: 7.2 },
      D: { min: 6.0, max: 6.6 },
      F: { min: 0, max: 5.9 },
    },
    maxGPA: 4.3
  },
  'simple-4.0': {
    scale: { A_PLUS: 4.0, A: 4.0, B_PLUS: 3.0, B: 3.0, C_PLUS: 2.0, C: 2.0, D_PLUS: 1.0, D: 1.0, F: 0.0 },
    gradeRanges: {
      A_PLUS: { min: 9.0, max: 10.0 },
      A: { min: 9.0, max: 10.0 },
      B_PLUS: { min: 8.0, max: 8.9 },
      B: { min: 8.0, max: 8.9 },
      C_PLUS: { min: 7.0, max: 7.9 },
      C: { min: 7.0, max: 7.9 },
      D_PLUS: { min: 6.0, max: 6.9 },
      D: { min: 6.0, max: 6.9 },
      F: { min: 0, max: 5.9 },
    },
    maxGPA: 4.0
  },
  'simple-5.0': {
    scale: { A_PLUS: 5.0, A: 5.0, B_PLUS: 4.0, B: 4.0, C_PLUS: 3.0, C: 3.0, D_PLUS: 2.0, D: 2.0, F: 0.0 },
    gradeRanges: {
      A_PLUS: { min: 9.0, max: 10.0 },
      A: { min: 9.0, max: 10.0 },
      B_PLUS: { min: 8.0, max: 8.9 },
      B: { min: 8.0, max: 8.9 },
      C_PLUS: { min: 7.0, max: 7.9 },
      C: { min: 7.0, max: 7.9 },
      D_PLUS: { min: 6.0, max: 6.9 },
      D: { min: 6.0, max: 6.9 },
      F: { min: 0, max: 5.9 },
    },
    maxGPA: 5.0
  }
};

// Backwards compatibility
export const GPA_SCALE = DEFAULT_GPA_SCALE;

// Chuyển đổi điểm số sang thang GPA với cấu hình tùy chỉnh
export function convertGradeToGPA(grade: number, gpaSettings?: GPASettings): number {
  const settings = gpaSettings || DEFAULT_GPA_SETTINGS;
  const ranges = settings.gradeRanges;
  
  if (grade >= ranges.A_PLUS.min) return settings.scale.A_PLUS;
  if (grade >= ranges.A.min) return settings.scale.A;
  if (grade >= ranges.B_PLUS.min) return settings.scale.B_PLUS;
  if (grade >= ranges.B.min) return settings.scale.B;
  if (grade >= ranges.C_PLUS.min) return settings.scale.C_PLUS;
  if (grade >= ranges.C.min) return settings.scale.C;
  if (grade >= ranges.D_PLUS.min) return settings.scale.D_PLUS;
  if (grade >= ranges.D.min) return settings.scale.D;
  return settings.scale.F;
}

// Chuyển đổi điểm GPA về thang 10 với cấu hình tùy chỉnh
export function convertGPAToGrade(gpa: number, gpaSettings?: GPASettings): number {
  const settings = gpaSettings || DEFAULT_GPA_SETTINGS;
  const ranges = settings.gradeRanges;
  
  if (gpa >= settings.scale.A_PLUS) return (ranges.A_PLUS.min + ranges.A_PLUS.max) / 2;
  if (gpa >= settings.scale.A) return (ranges.A.min + ranges.A.max) / 2;
  if (gpa >= settings.scale.B_PLUS) return (ranges.B_PLUS.min + ranges.B_PLUS.max) / 2;
  if (gpa >= settings.scale.B) return (ranges.B.min + ranges.B.max) / 2;
  if (gpa >= settings.scale.C_PLUS) return (ranges.C_PLUS.min + ranges.C_PLUS.max) / 2;
  if (gpa >= settings.scale.C) return (ranges.C.min + ranges.C.max) / 2;
  if (gpa >= settings.scale.D_PLUS) return (ranges.D_PLUS.min + ranges.D_PLUS.max) / 2;
  if (gpa >= settings.scale.D) return (ranges.D.min + ranges.D.max) / 2;
  return (ranges.F.min + ranges.F.max) / 2;
}

// Lấy letter grade từ điểm số với cấu hình tùy chỉnh
export function getLetterGrade(grade: number, gpaSettings?: GPASettings): string {
  const settings = gpaSettings || DEFAULT_GPA_SETTINGS;
  const ranges = settings.gradeRanges;
  
  if (grade >= ranges.A_PLUS.min) return "A+";
  if (grade >= ranges.A.min) return "A";
  if (grade >= ranges.B_PLUS.min) return "B+";
  if (grade >= ranges.B.min) return "B";
  if (grade >= ranges.C_PLUS.min) return "C+";
  if (grade >= ranges.C.min) return "C";
  if (grade >= ranges.D_PLUS.min) return "D+";
  if (grade >= ranges.D.min) return "D";
  return "F";
}

// Tính GPA cho một học kỳ với cấu hình tùy chỉnh
export function calculateSemesterGPA(subjects: Subject[], gpaSettings?: GPASettings): number {
  const validSubjects = subjects.filter(s => s.grade !== null && s.grade !== undefined);
  
  if (validSubjects.length === 0) return 0;
  
  let totalPoints = 0;
  let totalCredits = 0;
  
  validSubjects.forEach(subject => {
    const gpaPoint = convertGradeToGPA(subject.grade!, gpaSettings);
    totalPoints += gpaPoint * subject.credits;
    totalCredits += subject.credits;
  });
  
  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

// Tính GPA tích lũy với cấu hình tùy chỉnh
export function calculateCumulativeGPA(semesters: Semester[], gpaSettings?: GPASettings): number {
  let totalPoints = 0;
  let totalCredits = 0;
  
  semesters.forEach(semester => {
    semester.subjects.forEach(subject => {
      if (subject.grade !== null && subject.grade !== undefined) {
        const gpaPoint = convertGradeToGPA(subject.grade, gpaSettings);
        totalPoints += gpaPoint * subject.credits;
        totalCredits += subject.credits;
      }
    });
  });
  
  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

// Xác định học lực với cấu hình tùy chỉnh
export function getAcademicLevels(gpaSettings?: GPASettings): AcademicLevel[] {
  const settings = gpaSettings || DEFAULT_GPA_SETTINGS;
  const maxGPA = settings.maxGPA;
  
  return [
    { level: 'Xuất sắc', minGPA: maxGPA * 0.925, maxGPA: maxGPA, color: 'text-purple-600' }, // 3.7/4.0 = 92.5%
    { level: 'Giỏi', minGPA: maxGPA * 0.825, maxGPA: maxGPA * 0.924, color: 'text-blue-600' }, // 3.3-3.69
    { level: 'Khá', minGPA: maxGPA * 0.575, maxGPA: maxGPA * 0.824, color: 'text-green-600' }, // 2.3-3.29
    { level: 'Trung bình', minGPA: maxGPA * 0.5, maxGPA: maxGPA * 0.574, color: 'text-yellow-600' }, // 2.0-2.29
    { level: 'Yếu', minGPA: maxGPA * 0.25, maxGPA: maxGPA * 0.499, color: 'text-orange-600' }, // 1.0-1.99
    { level: 'Kém', minGPA: 0.0, maxGPA: maxGPA * 0.249, color: 'text-red-600' }, // 0.0-0.99
  ];
}

// Backwards compatibility
export const ACADEMIC_LEVELS = getAcademicLevels();

export function getAcademicLevel(gpa: number, gpaSettings?: GPASettings): AcademicLevel {
  const levels = getAcademicLevels(gpaSettings);
  return levels.find(level => gpa >= level.minGPA && gpa <= level.maxGPA) || levels[5];
}

// Danh sách học bổng với cấu hình tùy chỉnh
export function getScholarships(gpaSettings?: GPASettings): ScholarshipRequirement[] {
  const settings = gpaSettings || DEFAULT_GPA_SETTINGS;
  const maxGPA = settings.maxGPA;
  
  return [
    { name: 'Học bổng Xuất sắc', minGPA: maxGPA * 0.925, description: 'Dành cho sinh viên có GPA xuất sắc' },
    { name: 'Học bổng Khuyến khích học tập', minGPA: maxGPA * 0.825, description: 'Dành cho sinh viên có GPA giỏi' },
    { name: 'Học bổng Tiến bộ', minGPA: maxGPA * 0.75, description: 'Dành cho sinh viên có GPA khá trở lên' },
  ];
}

// Backwards compatibility
export const SCHOLARSHIPS = getScholarships();

// Tính điểm cần thiết để đạt mục tiêu GPA với cấu hình tùy chỉnh
export function calculateRequiredGPA(
  currentSemesters: Semester[],
  targetGPA: number,
  newSemesterCredits: number,
  gpaSettings?: GPASettings
): number {
  const currentGPA = calculateCumulativeGPA(currentSemesters, gpaSettings);
  const currentCredits = currentSemesters.reduce((total, sem) => 
    total + sem.subjects.reduce((semTotal, sub) => 
      sub.grade !== null ? semTotal + sub.credits : semTotal, 0), 0);
  
  const totalCreditsAfter = currentCredits + newSemesterCredits;
  const requiredTotalPoints = targetGPA * totalCreditsAfter;
  const currentTotalPoints = currentGPA * currentCredits;
  const requiredNewPoints = requiredTotalPoints - currentTotalPoints;
  
  return newSemesterCredits > 0 ? requiredNewPoints / newSemesterCredits : 0;
}

// Mô phỏng thay đổi điểm với cấu hình tùy chỉnh
export function simulateGradeChange(
  subjects: Subject[],
  subjectId: string,
  newGrade: number,
  gpaSettings?: GPASettings
): { newGPA: number; change: number } {
  const originalGPA = calculateSemesterGPA(subjects, gpaSettings);
  
  const modifiedSubjects = subjects.map(s => 
    s.id === subjectId ? { ...s, grade: newGrade } : s
  );
  
  const newGPA = calculateSemesterGPA(modifiedSubjects, gpaSettings);
  const change = newGPA - originalGPA;
  
  return { newGPA, change };
}

// Lấy gợi ý cải thiện GPA với cấu hình tùy chỉnh
export function getImprovementSuggestions(
  currentGPA: number,
  subjects: Subject[],
  gpaSettings?: GPASettings
): string[] {
  const suggestions: string[] = [];
  const academicLevel = getAcademicLevel(currentGPA, gpaSettings);
  const settings = gpaSettings || DEFAULT_GPA_SETTINGS;
  const maxGPA = settings.maxGPA;
  
  const threshold_weak = maxGPA * 0.5;      // 2.0/4.0
  const threshold_average = maxGPA * 0.575; // 2.3/4.0  
  const threshold_good = maxGPA * 0.825;    // 3.3/4.0
  const threshold_excellent = maxGPA * 0.925; // 3.7/4.0
  
  if (currentGPA < threshold_weak) {
    suggestions.push('🚨 GPA hiện tại ở mức Yếu. Cần cải thiện ngay lập tức!');
    suggestions.push('📚 Tập trung vào các môn có số tín chỉ cao');
    suggestions.push('💪 Cần cải thiện điểm số để đạt mức Trung bình');
  } else if (currentGPA < threshold_average) {
    suggestions.push('⚠️ GPA đang ở mức Trung bình. Có thể cải thiện!');
    suggestions.push('🎯 Cố gắng nâng cao điểm số ở các môn tiếp theo');
  } else if (currentGPA < threshold_good) {
    suggestions.push('👍 GPA đang ở mức Khá. Hãy phấn đấu lên Giỏi!');
    suggestions.push('🏆 Cần cải thiện điểm để có cơ hội học bổng');
  } else if (currentGPA < threshold_excellent) {
    suggestions.push('🌟 GPA đang ở mức Giỏi. Gần đạt Xuất sắc!');
    suggestions.push('💎 Cần duy trì điểm cao để lên mức Xuất sắc');
  } else if (currentGPA < maxGPA) {
    suggestions.push('🎉 Xuất sắc! Hãy duy trì phẩm độ này!');
    suggestions.push('👑 Bạn đang đủ điều kiện cho các học bổng cao nhất');
    suggestions.push('⭐ Cố gắng duy trì để đạt mức hoàn hảo!');
  } else {
    suggestions.push(`🏆 Hoàn hảo! GPA ${maxGPA.toFixed(1)} - Đỉnh cao học tập!`);
    suggestions.push('👑 Bạn đã đạt được thành tích xuất sắc nhất');
    suggestions.push('🌟 Hãy tiếp tục duy trì sự xuất sắc này!');
  }
  
  return suggestions;
} 