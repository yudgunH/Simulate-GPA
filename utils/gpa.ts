import { Subject, Semester, StudentRecord, GPAScale, AcademicLevel, ScholarshipRequirement } from '@/types';

// Thang điểm 4.0
export const GPA_SCALE: GPAScale = {
  A: 4.0,        // 8.5-10
  B_PLUS: 3.5,   // 8.0-8.4
  B: 3.0,        // 7.0-7.9
  C_PLUS: 2.5,   // 6.5-6.9
  C: 2.0,        // 5.5-6.4
  D_PLUS: 1.5,   // 5.0-5.4
  D: 1.0,        // 4.0-4.9
  F: 0.0,        // 0-3.9
};

// Chuyển đổi điểm số sang thang 4.0
export function convertGradeToGPA(grade: number): number {
  if (grade >= 8.5) return GPA_SCALE.A;
  if (grade >= 8.0) return GPA_SCALE.B_PLUS;
  if (grade >= 7.0) return GPA_SCALE.B;
  if (grade >= 6.5) return GPA_SCALE.C_PLUS;
  if (grade >= 5.5) return GPA_SCALE.C;
  if (grade >= 5.0) return GPA_SCALE.D_PLUS;
  if (grade >= 4.0) return GPA_SCALE.D;
  return GPA_SCALE.F;
}

// Chuyển đổi điểm 4.0 về thang 10
export function convertGPAToGrade(gpa: number): number {
  if (gpa >= 4.0) return 9.0;
  if (gpa >= 3.5) return 8.2;
  if (gpa >= 3.0) return 7.5;
  if (gpa >= 2.5) return 6.7;
  if (gpa >= 2.0) return 6.0;
  if (gpa >= 1.5) return 5.2;
  if (gpa >= 1.0) return 4.5;
  return 2.0;
}

// Tính GPA cho một học kỳ
export function calculateSemesterGPA(subjects: Subject[]): number {
  const validSubjects = subjects.filter(s => s.grade !== null && s.grade !== undefined);
  
  if (validSubjects.length === 0) return 0;
  
  let totalPoints = 0;
  let totalCredits = 0;
  
  validSubjects.forEach(subject => {
    const gpaPoint = convertGradeToGPA(subject.grade!);
    totalPoints += gpaPoint * subject.credits;
    totalCredits += subject.credits;
  });
  
  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

// Tính GPA tích lũy
export function calculateCumulativeGPA(semesters: Semester[]): number {
  let totalPoints = 0;
  let totalCredits = 0;
  
  semesters.forEach(semester => {
    semester.subjects.forEach(subject => {
      if (subject.grade !== null && subject.grade !== undefined) {
        const gpaPoint = convertGradeToGPA(subject.grade);
        totalPoints += gpaPoint * subject.credits;
        totalCredits += subject.credits;
      }
    });
  });
  
  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

// Xác định học lực
export const ACADEMIC_LEVELS: AcademicLevel[] = [
  { level: 'Xuất sắc', minGPA: 3.6, maxGPA: 4.0, color: 'text-purple-600' },
  { level: 'Giỏi', minGPA: 3.2, maxGPA: 3.59, color: 'text-blue-600' },
  { level: 'Khá', minGPA: 2.5, maxGPA: 3.19, color: 'text-green-600' },
  { level: 'Trung bình', minGPA: 2.0, maxGPA: 2.49, color: 'text-yellow-600' },
  { level: 'Yếu', minGPA: 1.0, maxGPA: 1.99, color: 'text-orange-600' },
  { level: 'Kém', minGPA: 0.0, maxGPA: 0.99, color: 'text-red-600' },
];

export function getAcademicLevel(gpa: number): AcademicLevel {
  return ACADEMIC_LEVELS.find(level => gpa >= level.minGPA && gpa <= level.maxGPA) || ACADEMIC_LEVELS[5];
}

// Danh sách học bổng
export const SCHOLARSHIPS: ScholarshipRequirement[] = [
  { name: 'Học bổng Xuất sắc', minGPA: 3.6, description: 'Dành cho sinh viên có GPA >= 3.6' },
  { name: 'Học bổng Khuyến khích học tập', minGPA: 3.2, description: 'Dành cho sinh viên có GPA >= 3.2' },
  { name: 'Học bổng Tiến bộ', minGPA: 2.8, description: 'Dành cho sinh viên có GPA >= 2.8' },
];

// Tính điểm cần thiết để đạt mục tiêu GPA
export function calculateRequiredGPA(
  currentSemesters: Semester[],
  targetGPA: number,
  newSemesterCredits: number
): number {
  const currentGPA = calculateCumulativeGPA(currentSemesters);
  const currentCredits = currentSemesters.reduce((total, sem) => 
    total + sem.subjects.reduce((semTotal, sub) => 
      sub.grade !== null ? semTotal + sub.credits : semTotal, 0), 0);
  
  const totalCreditsAfter = currentCredits + newSemesterCredits;
  const requiredTotalPoints = targetGPA * totalCreditsAfter;
  const currentTotalPoints = currentGPA * currentCredits;
  const requiredNewPoints = requiredTotalPoints - currentTotalPoints;
  
  return newSemesterCredits > 0 ? requiredNewPoints / newSemesterCredits : 0;
}

// Mô phỏng thay đổi điểm
export function simulateGradeChange(
  subjects: Subject[],
  subjectId: string,
  newGrade: number
): { newGPA: number; change: number } {
  const originalGPA = calculateSemesterGPA(subjects);
  
  const modifiedSubjects = subjects.map(s => 
    s.id === subjectId ? { ...s, grade: newGrade } : s
  );
  
  const newGPA = calculateSemesterGPA(modifiedSubjects);
  const change = newGPA - originalGPA;
  
  return { newGPA, change };
}

// Lấy gợi ý cải thiện GPA
export function getImprovementSuggestions(
  currentGPA: number,
  subjects: Subject[]
): string[] {
  const suggestions: string[] = [];
  const academicLevel = getAcademicLevel(currentGPA);
  
  if (currentGPA < 2.0) {
    suggestions.push('🚨 GPA hiện tại ở mức Yếu. Cần cải thiện ngay lập tức!');
    suggestions.push('📚 Tập trung vào các môn có số tín chỉ cao');
    suggestions.push('💪 Cần đạt ít nhất 6.0 điểm ở các môn sắp tới');
  } else if (currentGPA < 2.5) {
    suggestions.push('⚠️ GPA đang ở mức Trung bình. Có thể cải thiện!');
    suggestions.push('🎯 Cố gắng đạt 7.0+ ở các môn tiếp theo');
  } else if (currentGPA < 3.2) {
    suggestions.push('👍 GPA đang ở mức Khá. Hãy phấn đấu lên Giỏi!');
    suggestions.push('🏆 Cần đạt 8.0+ để có cơ hội học bổng');
  } else if (currentGPA < 3.6) {
    suggestions.push('🌟 GPA đang ở mức Giỏi. Gần đạt Xuất sắc!');
    suggestions.push('💎 Cần đạt 8.5+ để lên mức Xuất sắc');
  } else {
    suggestions.push('🎉 Xuất sắc! Hãy duy trì phẩm độ này!');
    suggestions.push('👑 Bạn đang đủ điều kiện cho các học bổng cao nhất');
  }
  
  return suggestions;
} 