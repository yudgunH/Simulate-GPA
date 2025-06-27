import { StudentRecord, Semester, Subject } from '@/types';
import * as XLSX from 'xlsx';
import { calculateSemesterGPA, calculateCumulativeGPA, getLetterGrade, getAcademicLevel } from './gpa';

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

// Export dữ liệu ra file Excel
export function exportToExcel(data: StudentRecord): void {
  const workbook = XLSX.utils.book_new();
  
  // Tạo sheet tổng quan
  const summaryData = [
    ['📊 BẢNG ĐIỂM SINH VIÊN', '', '', '', ''],
    ['Tên sinh viên:', data.studentName, '', '', ''],
    ['Ngày xuất:', new Date().toLocaleDateString('vi-VN'), '', '', ''],
    ['', '', '', '', ''],
    ['📈 TỔNG KẾT', '', '', '', ''],
    ['GPA tích lũy:', calculateCumulativeGPA(data.semesters).toFixed(2), '', '', ''],
    ['Học lực:', getAcademicLevel(calculateCumulativeGPA(data.semesters)).level, '', '', ''],
    ['Tổng tín chỉ đã học:', data.semesters.reduce((total, sem) => 
      total + sem.subjects.reduce((semTotal, sub) => 
        sub.grade !== null ? semTotal + sub.credits : semTotal, 0), 0), '', '', ''],
    ['', '', '', '', ''],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng quan');
  
  // Tạo sheet cho từng học kỳ
  data.semesters.forEach((semester, index) => {
    const semesterData = [
      [`📚 ${semester.name.toUpperCase()}`, '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['STT', 'Tên môn học', 'Tín chỉ', 'Điểm số', 'Điểm chữ', 'GPA'],
    ];
    
    semester.subjects.forEach((subject, idx) => {
      const grade = subject.grade;
      const letterGrade = grade !== null ? getLetterGrade(grade) : '';
      const gpaPoint = grade !== null ? grade.toString() : '';
      
      semesterData.push([
        (idx + 1).toString(),
        subject.name,
        subject.credits.toString(),
        grade !== null ? grade.toString() : '',
        letterGrade,
        gpaPoint
      ]);
    });
    
    // Thêm dòng tổng kết
    semesterData.push(['', '', '', '', '', '']);
    semesterData.push(['', 'GPA học kỳ:', '', '', '', calculateSemesterGPA(semester.subjects).toFixed(2)]);
    semesterData.push(['', 'Tổng tín chỉ:', '', '', '', semester.subjects.reduce((total, sub) => 
      sub.grade !== null ? total + sub.credits : total, 0).toString()]);
    
    const sheet = XLSX.utils.aoa_to_sheet(semesterData);
    
    // Định dạng cột
    const colWidths = [
      { wch: 5 },   // STT
      { wch: 25 },  // Tên môn
      { wch: 8 },   // Tín chỉ
      { wch: 8 },   // Điểm số
      { wch: 10 },  // Điểm chữ
      { wch: 8 },   // GPA
    ];
    sheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, sheet, `Học kỳ ${index + 1}`);
  });
  
  // Tạo sheet báo cáo chi tiết
  const detailData = [
    ['📋 BÁO CÁO CHI TIẾT', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['Học kỳ', 'Số môn', 'Tín chỉ', 'GPA học kỳ', 'GPA tích lũy', 'Học lực', 'Ghi chú'],
  ];
  
  let cumulativeCredits = 0;
  data.semesters.forEach((semester, index) => {
    const semesterGPA = calculateSemesterGPA(semester.subjects);
    const semesterCredits = semester.subjects.reduce((total, sub) => 
      sub.grade !== null ? total + sub.credits : total, 0);
    cumulativeCredits += semesterCredits;
    
    // Tính GPA tích lũy đến học kỳ hiện tại
    const semestersUpToNow = data.semesters.slice(0, index + 1);
    const cumulativeGPA = calculateCumulativeGPA(semestersUpToNow);
    const academicLevel = getAcademicLevel(cumulativeGPA);
    
    detailData.push([
      semester.name,
      semester.subjects.filter(s => s.grade !== null).length.toString(),
      semesterCredits.toString(),
      semesterGPA.toFixed(2),
      cumulativeGPA.toFixed(2),
      academicLevel.level,
      cumulativeGPA >= 3.7 ? '🏆 Xuất sắc' : cumulativeGPA >= 3.3 ? '🌟 Tốt' : '📚 Cần cố gắng'
    ]);
  });
  
  const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
  detailSheet['!cols'] = [
    { wch: 15 }, // Học kỳ
    { wch: 8 },  // Số môn
    { wch: 8 },  // Tín chỉ
    { wch: 12 }, // GPA học kỳ
    { wch: 12 }, // GPA tích lũy
    { wch: 12 }, // Học lực
    { wch: 15 }, // Ghi chú
  ];
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Báo cáo chi tiết');
  
  // Xuất file
  const fileName = `BangDiem_${data.studentName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
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