import { StudentRecord, Semester, Subject } from '@/types';

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
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu:', error);
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