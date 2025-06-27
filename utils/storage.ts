import { StudentRecord, Semester, Subject } from '@/types';
import * as XLSX from 'xlsx';
import { calculateSemesterGPA, calculateCumulativeGPA, getLetterGrade, getAcademicLevel, convertGradeToGPA } from './gpa';

const STORAGE_KEY = 'simulate-gpa-data';

// Lưu dữ liệu vào localStorage
export function saveData(data: StudentRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu:', error);
  }
}

// Lấy dữ liệu từ localStorage
export function loadData(): StudentRecord | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      
      // Kiểm tra tính hợp lệ của dữ liệu
      if (!parsed.id || !parsed.semesters || !Array.isArray(parsed.semesters)) {
        console.warn('⚠️ Dữ liệu trong localStorage không hợp lệ, thử khôi phục từ backup');
        return tryRestoreFromBackup();
      }
      
      console.log('✅ Đã tải dữ liệu từ localStorage thành công');
      return parsed;
    }
    
    console.log('ℹ️ Không có dữ liệu trong localStorage');
    return null;
  } catch (error) {
    console.error('❌ Lỗi khi tải dữ liệu từ localStorage:', error);
    console.log('🔄 Thử khôi phục từ backup...');
    return tryRestoreFromBackup();
  }
}

// Thử khôi phục từ backup khi dữ liệu chính bị lỗi
function tryRestoreFromBackup(): StudentRecord | null {
  try {
    const backups = restoreFromBackup();
    if (backups.length > 0) {
      const latestBackup = backups[0];
      console.log('✅ Đã khôi phục từ backup thành công');
      return latestBackup;
    }
    console.log('⚠️ Không có backup để khôi phục');
    return null;
  } catch (error) {
    console.error('❌ Lỗi khi khôi phục backup:', error);
    return null;
  }
}

// Tạo dữ liệu mặc định
export function createDefaultData(): StudentRecord {
  return {
    id: 'student-1',
    studentName: 'Sinh viên',
    semesters: [
      {
        id: 'semester-1',
        name: 'Học kỳ hiện tại',
        subjects: [
          {
            id: 'subject-1',
            name: 'Toán cao cấp',
            credits: 3,
            grade: null,
          },
        ],
        gpa: 0,
      },
    ],
    cumulativeGPA: 0,
    totalCredits: 0,
    completedCredits: 0,
  };
}

// Export dữ liệu ra file
export function exportData(data: StudentRecord): void {
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `gpa-data-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

// Import dữ liệu từ file
export function importData(file: File): Promise<StudentRecord> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const data = JSON.parse(result) as StudentRecord;
        
        // Validate data structure
        if (!data.id || !data.semesters || !Array.isArray(data.semesters)) {
          throw new Error('File không đúng định dạng');
        }
        
        resolve(data);
      } catch (error) {
        reject(new Error('Lỗi khi đọc file: ' + (error as Error).message));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file'));
    reader.readAsText(file);
  });
}

// Clear all data
export function clearData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Lỗi khi xóa dữ liệu:', error);
  }
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Export dữ liệu ra file Excel với thông tin đầy đủ
export function exportToExcel(data: StudentRecord): void {
  const workbook = XLSX.utils.book_new();
  const cumulativeGPA = calculateCumulativeGPA(data.semesters);
  const academicLevel = getAcademicLevel(cumulativeGPA);
  
  // 1. SHEET TỔNG QUAN - Thông tin tổng quát
  const summaryData = [
    ['📊 BẢNG ĐIỂM SINH VIÊN', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['Thông tin sinh viên:', '', '', '', '', '', ''],
    ['Tên sinh viên:', data.studentName, '', '', '', '', ''],
    ['Ngày xuất báo cáo:', new Date().toLocaleDateString('vi-VN'), '', '', '', '', ''],
    ['Thời gian xuất:', new Date().toLocaleTimeString('vi-VN'), '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['📈 THỐNG KÊ TỔNG QUAN:', '', '', '', '', '', ''],
    ['GPA tích lũy:', cumulativeGPA.toFixed(3), '', '', '', '', ''],
    ['Xếp loại học lực:', academicLevel.level, '', '', '', '', ''],
    ['Tổng số học kỳ:', data.semesters.length.toString(), '', '', '', '', ''],
    ['Tổng số môn đã học:', data.semesters.reduce((total, sem) => 
      total + sem.subjects.filter(s => s.grade !== null).length, 0).toString(), '', '', '', '', ''],
    ['Tổng tín chỉ tích lũy:', data.semesters.reduce((total, sem) => 
      total + sem.subjects.reduce((semTotal, sub) => 
        sub.grade !== null ? semTotal + sub.credits : semTotal, 0), 0).toString(), '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['🎯 PHÂN TÍCH ĐIỂM SỐ:', '', '', '', '', '', ''],
  ];
  
  // Thống kê phân bố điểm theo grade
  const gradeStats: { [key: string]: number } = {};
  const allGradedSubjects = data.semesters.flatMap(sem => 
    sem.subjects.filter(sub => sub.grade !== null)
  );
  
  allGradedSubjects.forEach(subject => {
    if (subject.grade !== null) {
      const letterGrade = getLetterGrade(subject.grade);
      gradeStats[letterGrade] = (gradeStats[letterGrade] || 0) + 1;
    }
  });
  
  Object.entries(gradeStats).forEach(([grade, count]) => {
    summaryData.push([`Số môn đạt ${grade}:`, count.toString(), 
      `(${((count / allGradedSubjects.length) * 100).toFixed(1)}%)`, '', '', '', '']);
  });
  
  // Điểm cao nhất và thấp nhất
  const allGrades = allGradedSubjects.map(s => s.grade!);
  if (allGrades.length > 0) {
    summaryData.push(['', '', '', '', '', '', '']);
    summaryData.push(['Điểm cao nhất:', Math.max(...allGrades).toFixed(1), '', '', '', '', '']);
    summaryData.push(['Điểm thấp nhất:', Math.min(...allGrades).toFixed(1), '', '', '', '', '']);
    summaryData.push(['Điểm trung bình:', (allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(1), '', '', '', '', '']);
  }
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = Array(7).fill({ wch: 20 });
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng quan');
  
  // 2. SHEET TẤT CẢ CÁC MÔN - Danh sách đầy đủ
  const allSubjectsData = [
    ['📋 DANH SÁCH TẤT CẢ CÁC MÔN HỌC', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['STT', 'Học kỳ', 'Tên môn học', 'Tín chỉ', 'Điểm số', 'Điểm chữ', 'GPA Point', 'Điểm × Tín chỉ', 'Trạng thái'],
  ];
  
  let stt = 1;
  data.semesters.forEach((semester) => {
    semester.subjects.forEach((subject) => {
      const grade = subject.grade;
      const letterGrade = grade !== null ? getLetterGrade(grade) : 'Chưa có điểm';
      const gpaPoint = grade !== null ? convertGradeToGPA(grade).toFixed(1) : '0.0';
      const weightedPoints = grade !== null ? (grade * subject.credits).toFixed(1) : '0.0';
      const status = grade !== null ? 
        (grade >= 5.0 ? '✅ Đạt' : '❌ Không đạt') : '⏳ Chưa có điểm';
      
      allSubjectsData.push([
        stt.toString(),
        semester.name,
        subject.name,
        subject.credits.toString(),
        grade !== null ? grade.toFixed(1) : '',
        letterGrade,
        gpaPoint,
        weightedPoints,
        status
      ]);
      stt++;
    });
  });
  
  const allSubjectsSheet = XLSX.utils.aoa_to_sheet(allSubjectsData);
  allSubjectsSheet['!cols'] = [
    { wch: 5 },   // STT
    { wch: 15 },  // Học kỳ
    { wch: 30 },  // Tên môn
    { wch: 8 },   // Tín chỉ
    { wch: 10 },  // Điểm số
    { wch: 10 },  // Điểm chữ
    { wch: 10 },  // GPA Point
    { wch: 12 },  // Điểm × Tín chỉ
    { wch: 15 },  // Trạng thái
  ];
  XLSX.utils.book_append_sheet(workbook, allSubjectsSheet, 'Tất cả các môn');
  
  // 3. SHEET CHO TỪNG HỌC KỲ - Chi tiết từng học kỳ
  data.semesters.forEach((semester, index) => {
    const semesterData = [
      [`📚 ${semester.name.toUpperCase()}`, '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['STT', 'Tên môn học', 'Tín chỉ', 'Điểm số', 'Điểm chữ', 'GPA Point', 'Điểm × Tín chỉ', 'Ghi chú'],
    ];
    
    semester.subjects.forEach((subject, idx) => {
      const grade = subject.grade;
      const letterGrade = grade !== null ? getLetterGrade(grade) : '';
      const gpaPoint = grade !== null ? convertGradeToGPA(grade).toFixed(1) : '';
      const weightedPoints = grade !== null ? (grade * subject.credits).toFixed(1) : '';
      const note = grade !== null ? 
        (grade >= 8.5 ? '🏆 Xuất sắc' : 
         grade >= 7.0 ? '👍 Tốt' : 
         grade >= 5.5 ? '📚 Khá' : 
         grade >= 4.0 ? '⚠️ Yếu' : '❌ Kém') : 'Chưa có điểm';
      
      semesterData.push([
        (idx + 1).toString(),
        subject.name,
        subject.credits.toString(),
        grade !== null ? grade.toFixed(1) : '',
        letterGrade,
        gpaPoint,
        weightedPoints,
        note
      ]);
    });
    
    // Thống kê học kỳ
    const semesterGPA = calculateSemesterGPA(semester.subjects);
    const completedSubjects = semester.subjects.filter(s => s.grade !== null);
    const totalCredits = completedSubjects.reduce((total, sub) => total + sub.credits, 0);
    const totalWeightedGrades = completedSubjects.reduce((total, sub) => 
      total + (sub.grade! * sub.credits), 0);
    const averageGrade = totalCredits > 0 ? totalWeightedGrades / totalCredits : 0;
    
    semesterData.push(['', '', '', '', '', '', '', '']);
    semesterData.push(['THỐNG KÊ HỌC KỲ:', '', '', '', '', '', '', '']);
    semesterData.push(['Số môn đã hoàn thành:', completedSubjects.length.toString(), '', '', '', '', '', '']);
    semesterData.push(['Tổng tín chỉ:', totalCredits.toString(), '', '', '', '', '', '']);
    semesterData.push(['Điểm trung bình (thang 10):', averageGrade.toFixed(2), '', '', '', '', '', '']);
    semesterData.push(['GPA học kỳ (thang 4):', semesterGPA.toFixed(3), '', '', '', '', '', '']);
    semesterData.push(['Xếp loại:', getAcademicLevel(semesterGPA).level, '', '', '', '', '', '']);
    
    const sheet = XLSX.utils.aoa_to_sheet(semesterData);
    sheet['!cols'] = [
      { wch: 5 },   // STT
      { wch: 30 },  // Tên môn
      { wch: 8 },   // Tín chỉ
      { wch: 10 },  // Điểm số
      { wch: 10 },  // Điểm chữ
      { wch: 10 },  // GPA Point
      { wch: 12 },  // Điểm × Tín chỉ
      { wch: 15 },  // Ghi chú
    ];
    
    XLSX.utils.book_append_sheet(workbook, sheet, `HK${index + 1}_${semester.name.substring(0, 10)}`);
  });
  
  // 4. SHEET BÁO CÁO TIẾN ĐỘ - So sánh qua các học kỳ
  const progressData = [
    ['📈 BÁO CÁO TIẾN ĐỘ HỌC TẬP', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['Học kỳ', 'Số môn', 'Tín chỉ', 'Điểm TB', 'GPA HK', 'GPA tích lũy', 'Xếp loại', 'Xu hướng', 'Ghi chú'],
  ];
  
  let prevCumulativeGPA = 0;
  data.semesters.forEach((semester, index) => {
    const semesterGPA = calculateSemesterGPA(semester.subjects);
    const semesterCredits = semester.subjects.reduce((total, sub) => 
      sub.grade !== null ? total + sub.credits : total, 0);
    
    // Tính GPA tích lũy đến học kỳ hiện tại
    const semestersUpToNow = data.semesters.slice(0, index + 1);
    const currentCumulativeGPA = calculateCumulativeGPA(semestersUpToNow);
    const academicLevel = getAcademicLevel(currentCumulativeGPA);
    
    // Tính điểm trung bình thang 10
    const completedSubjects = semester.subjects.filter(s => s.grade !== null);
    const averageGrade = completedSubjects.length > 0 ? 
      completedSubjects.reduce((total, sub) => total + (sub.grade! * sub.credits), 0) / 
      completedSubjects.reduce((total, sub) => total + sub.credits, 0) : 0;
    
    // Xác định xu hướng
    let trend = '🆕 Mới';
    if (index > 0) {
      if (currentCumulativeGPA > prevCumulativeGPA) {
        trend = '📈 Tăng';
      } else if (currentCumulativeGPA < prevCumulativeGPA) {
        trend = '📉 Giảm';
      } else {
        trend = '➡️ Ổn định';
      }
    }
    
    // Ghi chú đặc biệt
    let note = '';
    if (semesterGPA >= 3.7) note = '🏆 Xuất sắc';
    else if (semesterGPA >= 3.3) note = '🌟 Giỏi';
    else if (semesterGPA >= 2.3) note = '👍 Khá';
    else if (semesterGPA >= 2.0) note = '📚 Trung bình';
    else if (semesterGPA >= 1.0) note = '⚠️ Yếu';
    else note = '❌ Kém';
    
    progressData.push([
      semester.name,
      completedSubjects.length.toString(),
      semesterCredits.toString(),
      averageGrade.toFixed(2),
      semesterGPA.toFixed(3),
      currentCumulativeGPA.toFixed(3),
      academicLevel.level,
      trend,
      note
    ]);
    
    prevCumulativeGPA = currentCumulativeGPA;
  });
  
  const progressSheet = XLSX.utils.aoa_to_sheet(progressData);
  progressSheet['!cols'] = [
    { wch: 15 }, // Học kỳ
    { wch: 8 },  // Số môn
    { wch: 8 },  // Tín chỉ
    { wch: 10 }, // Điểm TB
    { wch: 10 }, // GPA HK
    { wch: 12 }, // GPA tích lũy
    { wch: 12 }, // Xếp loại
    { wch: 10 }, // Xu hướng
    { wch: 15 }, // Ghi chú
  ];
  XLSX.utils.book_append_sheet(workbook, progressSheet, 'Tiến độ học tập');
  
  // 5. SHEET PHÂN TÍCH THỐNG KÊ
  const statsData = [
    ['📊 PHÂN TÍCH THỐNG KÊ CHI TIẾT', '', '', '', ''],
    ['', '', '', '', ''],
    ['THỐNG KÊ THEO ĐIỂM CHỮ:', '', '', '', ''],
    ['Loại điểm', 'Số môn', 'Phần trăm', 'Tín chỉ', 'Ghi chú'],
  ];
  
  // Thống kê chi tiết theo từng grade
  const detailedGradeStats: { [key: string]: { count: number, credits: number } } = {};
  allGradedSubjects.forEach(subject => {
    if (subject.grade !== null) {
      const letterGrade = getLetterGrade(subject.grade);
      if (!detailedGradeStats[letterGrade]) {
        detailedGradeStats[letterGrade] = { count: 0, credits: 0 };
      }
      detailedGradeStats[letterGrade].count++;
      detailedGradeStats[letterGrade].credits += subject.credits;
    }
  });
  
  const gradeOrder = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
  gradeOrder.forEach(grade => {
    if (detailedGradeStats[grade]) {
      const stat = detailedGradeStats[grade];
      const percentage = ((stat.count / allGradedSubjects.length) * 100).toFixed(1);
      let note = '';
      if (grade === 'A+' || grade === 'A') note = '🏆 Xuất sắc';
      else if (grade === 'B+' || grade === 'B') note = '👍 Tốt';
      else if (grade === 'C+' || grade === 'C') note = '📚 Khá';
      else if (grade === 'D+' || grade === 'D') note = '⚠️ Đạt';
      else note = '❌ Không đạt';
      
      statsData.push([grade, stat.count.toString(), `${percentage}%`, stat.credits.toString(), note]);
    }
  });
  
  // Thêm thống kê khác
  statsData.push(['', '', '', '', '']);
  statsData.push(['THỐNG KÊ KHÁC:', '', '', '', '']);
  statsData.push(['Tỷ lệ đạt (≥5.0):', 
    `${allGradedSubjects.filter(s => s.grade! >= 5.0).length}/${allGradedSubjects.length}`,
    `${((allGradedSubjects.filter(s => s.grade! >= 5.0).length / allGradedSubjects.length) * 100).toFixed(1)}%`,
    '', '']);
  statsData.push(['Tỷ lệ giỏi (≥8.0):', 
    `${allGradedSubjects.filter(s => s.grade! >= 8.0).length}/${allGradedSubjects.length}`,
    `${((allGradedSubjects.filter(s => s.grade! >= 8.0).length / allGradedSubjects.length) * 100).toFixed(1)}%`,
    '', '']);
  
  const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
  statsSheet['!cols'] = [
    { wch: 15 }, // Loại điểm
    { wch: 10 }, // Số môn
    { wch: 12 }, // Phần trăm
    { wch: 10 }, // Tín chỉ
    { wch: 15 }, // Ghi chú
  ];
  XLSX.utils.book_append_sheet(workbook, statsSheet, 'Thống kê');
  
  // Xuất file với tên chi tiết
  const fileName = `BangDiem_ChiTiet_${data.studentName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
  
  console.log('✅ Đã xuất file Excel với đầy đủ thông tin:', fileName);
}

// Export dữ liệu ra file Excel với thông tin siêu chi tiết
export function exportDetailedExcel(data: StudentRecord): void {
  const workbook = XLSX.utils.book_new();
  const cumulativeGPA = calculateCumulativeGPA(data.semesters);
  const academicLevel = getAcademicLevel(cumulativeGPA);
  
  // 1. SHEET CHI TIẾT TẤT CẢ CÁC MÔN - Thông tin đầy đủ nhất
  const detailedSubjectsData = [
    ['📚 DANH SÁCH CHI TIẾT TẤT CẢ CÁC MÔN HỌC', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    [
      'STT', 'Mã môn', 'Tên môn học', 'Tín chỉ', 'Học kỳ', 'Loại môn', 'Khoa/Bộ môn', 'Giảng viên',
      'Lý thuyết (tiết)', 'Thực hành (tiết)', 'Giờ học/tuần', 'Độ khó', 'Độ quan trọng',
      'Điểm chuyên cần', 'Điểm quá trình', 'Điểm giữa kỳ', 'Điểm cuối kỳ', 'Điểm tổng', 'Điểm chữ', 'Ghi chú'
    ]
  ];
  
  let stt = 1;
  data.semesters.forEach((semester) => {
    semester.subjects.forEach((subject) => {
      const grade = subject.grade;
      const letterGrade = grade !== null ? getLetterGrade(grade) : '';
      
      // Ánh xạ loại môn
      const courseTypeMap = {
        'required': 'Bắt buộc',
        'elective': 'Tự chọn', 
        'major': 'Chuyên ngành',
        'general': 'Đại cương'
      };
      
      // Hiển thị độ khó và quan trọng bằng sao
      const getDifficultyStars = (level?: number) => level ? '⭐'.repeat(level) : '';
      const getImportanceStars = (level?: number) => level ? '🔥'.repeat(level) : '';
      
      detailedSubjectsData.push([
        stt.toString(),
        subject.courseCode || '',
        subject.name,
        subject.credits.toString(),
        subject.semester || semester.name,
        subject.courseType ? courseTypeMap[subject.courseType] : '',
        subject.department || '',
        subject.instructor || '',
        subject.theoryHours?.toString() || '',
        subject.labHours?.toString() || '',
        subject.studyTime?.toString() || '',
        getDifficultyStars(subject.difficulty),
        getImportanceStars(subject.importance),
        subject.attendanceGrade?.toFixed(1) || '',
        subject.processGrade?.toFixed(1) || '',
        subject.midtermGrade?.toFixed(1) || '',
        subject.finalGrade?.toFixed(1) || '',
        grade?.toFixed(1) || '',
        letterGrade,
        subject.notes || ''
      ]);
      stt++;
    });
  });
  
  const detailedSheet = XLSX.utils.aoa_to_sheet(detailedSubjectsData);
  detailedSheet['!cols'] = [
    { wch: 5 },   // STT
    { wch: 10 },  // Mã môn
    { wch: 35 },  // Tên môn
    { wch: 8 },   // Tín chỉ
    { wch: 15 },  // Học kỳ
    { wch: 12 },  // Loại môn
    { wch: 15 },  // Khoa
    { wch: 20 },  // Giảng viên
    { wch: 12 },  // Lý thuyết
    { wch: 12 },  // Thực hành
    { wch: 12 },  // Giờ học
    { wch: 8 },   // Độ khó
    { wch: 12 },  // Độ quan trọng
    { wch: 12 },  // Chuyên cần
    { wch: 12 },  // Quá trình
    { wch: 12 },  // Giữa kỳ
    { wch: 12 },  // Cuối kỳ
    { wch: 10 },  // Tổng
    { wch: 10 },  // Chữ
    { wch: 30 },  // Ghi chú
  ];
  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Chi tiết tất cả môn');
  
  // 2. SHEET PHÂN TÍCH THEO LOẠI MÔN
  const courseTypeData = [
    ['📊 PHÂN TÍCH THEO LOẠI MÔN HỌC', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['Loại môn', 'Số môn', 'Tín chỉ', 'Điểm TB', 'GPA TB', 'Tỷ lệ đạt', 'Ghi chú'],
  ];
  
  const courseTypes = ['required', 'elective', 'major', 'general'] as const;
  const typeNames = {
    'required': 'Môn bắt buộc',
    'elective': 'Môn tự chọn', 
    'major': 'Môn chuyên ngành',
    'general': 'Môn đại cương'
  };
  
  courseTypes.forEach(type => {
    const subjectsOfType = data.semesters.flatMap(sem => 
      sem.subjects.filter(sub => sub.courseType === type && sub.grade !== null)
    );
    
    if (subjectsOfType.length > 0) {
      const totalCredits = subjectsOfType.reduce((sum, sub) => sum + sub.credits, 0);
      const avgGrade = subjectsOfType.reduce((sum, sub) => sum + (sub.grade! * sub.credits), 0) / totalCredits;
      const avgGPA = subjectsOfType.reduce((sum, sub) => sum + (convertGradeToGPA(sub.grade!) * sub.credits), 0) / totalCredits;
      const passRate = (subjectsOfType.filter(sub => sub.grade! >= 5.0).length / subjectsOfType.length * 100).toFixed(1);
      
      courseTypeData.push([
        typeNames[type],
        subjectsOfType.length.toString(),
        totalCredits.toString(),
        avgGrade.toFixed(2),
        avgGPA.toFixed(2),
        `${passRate}%`,
        avgGPA >= 3.5 ? '🏆 Xuất sắc' : avgGPA >= 3.0 ? '👍 Tốt' : '📚 Cần cố gắng'
      ]);
    }
  });
  
  const courseTypeSheet = XLSX.utils.aoa_to_sheet(courseTypeData);
  courseTypeSheet['!cols'] = Array(7).fill({ wch: 15 });
  XLSX.utils.book_append_sheet(workbook, courseTypeSheet, 'Phân tích theo loại môn');
  
  // 3. SHEET PHÂN TÍCH THEO GIẢNG VIÊN
  const instructorData = [
    ['👨‍🏫 PHÂN TÍCH THEO GIẢNG VIÊN', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['Giảng viên', 'Số môn', 'Điểm TB', 'GPA TB', 'Đánh giá', 'Ghi chú'],
  ];
  
  const instructorStats: { [key: string]: Subject[] } = {};
  data.semesters.forEach(sem => {
    sem.subjects.forEach(sub => {
      if (sub.instructor && sub.grade !== null) {
        if (!instructorStats[sub.instructor]) {
          instructorStats[sub.instructor] = [];
        }
        instructorStats[sub.instructor].push(sub);
      }
    });
  });
  
  Object.entries(instructorStats).forEach(([instructor, subjects]) => {
    const totalCredits = subjects.reduce((sum, sub) => sum + sub.credits, 0);
    const avgGrade = subjects.reduce((sum, sub) => sum + (sub.grade! * sub.credits), 0) / totalCredits;
    const avgGPA = subjects.reduce((sum, sub) => sum + (convertGradeToGPA(sub.grade!) * sub.credits), 0) / totalCredits;
    
    let evaluation = '';
    if (avgGPA >= 3.5) evaluation = '🌟 Rất tốt';
    else if (avgGPA >= 3.0) evaluation = '👍 Tốt';
    else if (avgGPA >= 2.5) evaluation = '📚 Khá';
    else evaluation = '⚠️ Trung bình';
    
    instructorData.push([
      instructor,
      subjects.length.toString(),
      avgGrade.toFixed(2),
      avgGPA.toFixed(2),
      evaluation,
      `${subjects.length} môn học`
    ]);
  });
  
  const instructorSheet = XLSX.utils.aoa_to_sheet(instructorData);
  instructorSheet['!cols'] = Array(6).fill({ wch: 20 });
  XLSX.utils.book_append_sheet(workbook, instructorSheet, 'Phân tích giảng viên');
  
  // 4. SHEET PHÂN TÍCH ĐỘ KHÓ VÀ QUAN TRỌNG
  const difficultyData = [
    ['⭐ PHÂN TÍCH ĐỘ KHÓ VÀ QUAN TRỌNG', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['Độ khó', 'Số môn', 'Điểm TB', 'GPA TB', 'Độ quan trọng TB', 'Kết quả', 'Ghi chú'],
  ];
  
  for (let difficulty = 1; difficulty <= 5; difficulty++) {
    const subjectsWithDifficulty = data.semesters.flatMap(sem => 
      sem.subjects.filter(sub => sub.difficulty === difficulty && sub.grade !== null)
    );
    
    if (subjectsWithDifficulty.length > 0) {
      const totalCredits = subjectsWithDifficulty.reduce((sum, sub) => sum + sub.credits, 0);
      const avgGrade = subjectsWithDifficulty.reduce((sum, sub) => sum + (sub.grade! * sub.credits), 0) / totalCredits;
      const avgGPA = subjectsWithDifficulty.reduce((sum, sub) => sum + (convertGradeToGPA(sub.grade!) * sub.credits), 0) / totalCredits;
      const avgImportance = subjectsWithDifficulty.reduce((sum, sub) => sum + (sub.importance || 0), 0) / subjectsWithDifficulty.length;
      
      difficultyData.push([
        `${difficulty} ${'⭐'.repeat(difficulty)}`,
        subjectsWithDifficulty.length.toString(),
        avgGrade.toFixed(2),
        avgGPA.toFixed(2),
        avgImportance.toFixed(1),
        avgGPA >= 3.0 ? '✅ Tốt' : '⚠️ Cần cải thiện',
        difficulty >= 4 ? 'Môn khó' : difficulty <= 2 ? 'Môn dễ' : 'Môn trung bình'
      ]);
    }
  }
  
  const difficultySheet = XLSX.utils.aoa_to_sheet(difficultyData);
  difficultySheet['!cols'] = Array(7).fill({ wch: 15 });
  XLSX.utils.book_append_sheet(workbook, difficultySheet, 'Phân tích độ khó');
  
  // 5. SHEET THỐNG KÊ ĐIỂM CHI TIẾT
  const gradeBreakdownData = [
    ['📋 THỐNG KÊ ĐIỂM CHI TIẾT', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['Loại điểm', 'Điểm TB', 'Điểm cao nhất', 'Điểm thấp nhất', 'Số môn có điểm', 'Tỷ lệ hoàn thành', 'Ảnh hưởng', 'Ghi chú'],
  ];
  
  const gradeTypes = [
    { key: 'attendanceGrade', name: 'Điểm chuyên cần', weight: '10%' },
    { key: 'processGrade', name: 'Điểm quá trình', weight: '20%' },
    { key: 'midtermGrade', name: 'Điểm giữa kỳ', weight: '30%' },
    { key: 'finalGrade', name: 'Điểm cuối kỳ', weight: '40%' },
    { key: 'grade', name: 'Điểm tổng kết', weight: '100%' }
  ];
  
  gradeTypes.forEach(gradeType => {
    const allSubjects = data.semesters.flatMap(sem => sem.subjects);
    const subjectsWithGrade = allSubjects.filter(sub => 
      (sub as any)[gradeType.key] !== null && (sub as any)[gradeType.key] !== undefined
    );
    
    if (subjectsWithGrade.length > 0) {
      const grades = subjectsWithGrade.map(sub => (sub as any)[gradeType.key] as number);
      const avgGrade = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
      const maxGrade = Math.max(...grades);
      const minGrade = Math.min(...grades);
      const completionRate = (subjectsWithGrade.length / allSubjects.length * 100).toFixed(1);
      
      gradeBreakdownData.push([
        gradeType.name,
        avgGrade.toFixed(2),
        maxGrade.toFixed(1),
        minGrade.toFixed(1),
        subjectsWithGrade.length.toString(),
        `${completionRate}%`,
        gradeType.weight,
        avgGrade >= 8.0 ? '🏆 Xuất sắc' : avgGrade >= 7.0 ? '👍 Tốt' : '📚 Cần cố gắng'
      ]);
    }
  });
  
  const gradeBreakdownSheet = XLSX.utils.aoa_to_sheet(gradeBreakdownData);
  gradeBreakdownSheet['!cols'] = Array(8).fill({ wch: 15 });
  XLSX.utils.book_append_sheet(workbook, gradeBreakdownSheet, 'Thống kê điểm chi tiết');
  
  // Gọi hàm xuất Excel cũ để có đầy đủ các sheet khác
  const fileName = `BangDiem_SieuChiTiet_${data.studentName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
  
  console.log('✅ Đã xuất file Excel siêu chi tiết:', fileName);
}

// Cải thiện chức năng lưu trữ localStorage với backup
export function saveDataWithBackup(data: StudentRecord): void {
  try {
    // Kiểm tra dữ liệu hợp lệ
    if (!data || !data.id || !data.semesters) {
      console.error('❌ Dữ liệu không hợp lệ, bỏ qua việc lưu');
      return;
    }

    const dataString = JSON.stringify(data);
    
    // Lưu dữ liệu chính
    localStorage.setItem(STORAGE_KEY, dataString);
    
    // Tạo backup với timestamp (chỉ tạo backup mỗi 30 giây để tránh spam)
    const now = Date.now();
    const lastBackupKey = `${STORAGE_KEY}_last_backup_time`;
    const lastBackupTime = localStorage.getItem(lastBackupKey);
    
    if (!lastBackupTime || (now - parseInt(lastBackupTime)) > 30000) {
      const backupKey = `${STORAGE_KEY}_backup_${now}`;
      localStorage.setItem(backupKey, dataString);
      localStorage.setItem(lastBackupKey, now.toString());
      
      // Giữ chỉ 5 backup gần nhất
      const allKeys = Object.keys(localStorage);
      const backupKeys = allKeys
        .filter(key => key.startsWith(`${STORAGE_KEY}_backup_`))
        .sort()
        .reverse();
      
      // Xóa backup cũ nếu có quá 5 backup
      backupKeys.slice(5).forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log('✅ Dữ liệu đã được lưu thành công với backup mới');
    } else {
      console.log('💾 Dữ liệu đã được lưu thành công');
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi lưu dữ liệu:', error);
    // Fallback về hàm saveData cũ
    try {
      saveData(data);
      console.log('✅ Đã lưu bằng phương thức fallback');
    } catch (fallbackError) {
      console.error('❌ Lỗi cả fallback:', fallbackError);
    }
  }
}

// Khôi phục từ backup
export function restoreFromBackup(): StudentRecord[] {
  try {
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys
      .filter(key => key.startsWith(`${STORAGE_KEY}_backup_`))
      .sort()
      .reverse();
    
    const backups: StudentRecord[] = [];
    backupKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const backup = JSON.parse(data);
          backup._backupDate = new Date(parseInt(key.split('_').pop() || '0')).toLocaleString('vi-VN');
          backups.push(backup);
        }
      } catch (error) {
        console.error('Lỗi khi đọc backup:', key, error);
      }
    });
    
    return backups;
  } catch (error) {
    console.error('Lỗi khi khôi phục backup:', error);
    return [];
  }
}

// Thống kê sử dụng localStorage
export function getStorageStats(): { 
  dataSize: string; 
  backupCount: number; 
  totalSize: string;
  lastSaved: string;
} {
  try {
    let totalBytes = 0;
    let dataBytes = 0;
    let backupCount = 0;
    let lastSaved = 'Chưa có dữ liệu';
    
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        const size = new Blob([data]).size;
        totalBytes += size;
        
        if (key === STORAGE_KEY) {
          dataBytes = size;
          try {
            const parsed = JSON.parse(data);
            lastSaved = new Date().toLocaleString('vi-VN'); // Hiện tại chưa lưu timestamp trong data
          } catch (error) {
            // ignore
          }
        } else if (key.startsWith(`${STORAGE_KEY}_backup_`)) {
          backupCount++;
        }
      }
    });
    
    return {
      dataSize: formatBytes(dataBytes),
      backupCount,
      totalSize: formatBytes(totalBytes),
      lastSaved
    };
  } catch (error) {
    console.error('Lỗi khi lấy thống kê:', error);
    return {
      dataSize: '0 B',
      backupCount: 0,
      totalSize: '0 B',
      lastSaved: 'Lỗi'
    };
  }
}

// Helper function để format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 