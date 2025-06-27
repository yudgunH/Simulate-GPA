import { StudentRecord, Semester, Subject } from '@/types';
import * as XLSX from 'xlsx';
import { calculateSemesterGPA, calculateCumulativeGPA, getLetterGrade, getAcademicLevel, convertGradeToGPA, DEFAULT_GPA_SETTINGS } from './gpa';

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
      
      // Migration: Thêm gpaSettings nếu chưa có
      if (!parsed.gpaSettings) {
        parsed.gpaSettings = DEFAULT_GPA_SETTINGS;
        console.log('🔄 Đã migrate dữ liệu cũ: thêm gpaSettings mặc định');
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
    gpaSettings: DEFAULT_GPA_SETTINGS, // Thêm cấu hình thang đo mặc định
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

// Import dữ liệu từ file Excel
export function importFromExcel(file: File): Promise<StudentRecord> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        const workbook = XLSX.read(result, { type: 'binary' });
        
        console.log('🔍 Debug: Đang phân tích file Excel...');
        console.log('Tên các sheet:', workbook.SheetNames);
        
        // Tìm sheet chứa dữ liệu môn học
        let dataSheet = null;
        let sheetName = '';
        
        // Ưu tiên tìm sheet "Chi tiết tất cả môn" hoặc "Tất cả các môn" (tên chính xác từ export)
        const prioritySheets = ['Chi tiết tất cả môn', 'Tất cả các môn', 'Tất cả môn', 'Danh sách môn'];
        for (const sheet of prioritySheets) {
          if (workbook.SheetNames.includes(sheet)) {
            dataSheet = workbook.Sheets[sheet];
            sheetName = sheet;
            break;
          }
        }
        
        // Nếu không tìm thấy, sử dụng sheet đầu tiên
        if (!dataSheet && workbook.SheetNames.length > 0) {
          sheetName = workbook.SheetNames[0];
          dataSheet = workbook.Sheets[sheetName];
        }
        
        if (!dataSheet) {
          throw new Error('Không tìm thấy sheet dữ liệu trong file Excel');
        }
        
        console.log('📋 Sheet được chọn:', sheetName);
        
        // Chuyển đổi sheet thành mảng
        const jsonData = XLSX.utils.sheet_to_json(dataSheet, { header: 1 }) as any[][];
        
        console.log('📊 Tổng số dòng:', jsonData.length);
        console.log('5 dòng đầu:', jsonData.slice(0, 5));
        
        if (jsonData.length < 3) {
          throw new Error('File Excel không có đủ dữ liệu');
        }
        
        // Tìm hàng header (dòng chứa "Tên môn học" hoặc các cột quan trọng)
        let headerRowIndex = -1;
        let nameColIndex = -1;
        let creditsColIndex = -1;
        let gradeColIndex = -1;
        let semesterColIndex = -1;
        
        console.log('🔎 Đang tìm header...');
        
        for (let i = 0; i < Math.min(15, jsonData.length); i++) {
          const row = jsonData[i];
          if (Array.isArray(row) && row.length > 0) {
            console.log(`Dòng ${i}:`, row);
            
            for (let j = 0; j < row.length; j++) {
              const cell = String(row[j] || '').toLowerCase().trim();
              
              // Tìm cột tên môn học (khớp chính xác với export)
              if (cell === 'tên môn học' || cell.includes('tên môn') || cell.includes('môn học')) {
                headerRowIndex = i;
                nameColIndex = j;
                console.log(`✅ Tìm thấy cột tên môn tại dòng ${i}, cột ${j}: "${row[j]}"`);
              } 
              // Tìm cột tín chỉ
              else if (cell === 'tín chỉ' || cell.includes('tín chỉ') || cell.includes('credits') || cell === 'tc') {
                creditsColIndex = j;
                console.log(`✅ Tìm thấy cột tín chỉ tại cột ${j}: "${row[j]}"`);
              } 
              // Tìm cột điểm (linh hoạt hơn)
              else if (
                cell === 'điểm số' || 
                cell === 'điểm tổng' || 
                cell === 'điểm' ||
                (cell.includes('điểm') && 
                 !cell.includes('chữ') && 
                 !cell.includes('×') && 
                 !cell.includes('chuyên cần') && 
                 !cell.includes('quá trình') && 
                 !cell.includes('giữa kỳ') && 
                 !cell.includes('cuối kỳ') &&
                 !cell.includes('gpa'))
              ) {
                gradeColIndex = j;
                console.log(`✅ Tìm thấy cột điểm tại cột ${j}: "${row[j]}"`);
              } 
              // Tìm cột học kỳ
              else if (cell === 'học kỳ' || cell.includes('học kỳ') || cell.includes('semester') || cell === 'hk') {
                semesterColIndex = j;
                console.log(`✅ Tìm thấy cột học kỳ tại cột ${j}: "${row[j]}"`);
              }
            }
            if (headerRowIndex !== -1) break;
          }
        }
        
        if (headerRowIndex === -1 || nameColIndex === -1) {
          console.log('❌ Không tìm thấy header phù hợp');
          console.log('Debug thông tin:', {
            headerRowIndex,
            nameColIndex,
            sheetsAvailable: workbook.SheetNames,
            selectedSheet: sheetName,
            first10Rows: jsonData.slice(0, 10)
          });
          throw new Error('Không tìm thấy cột "Tên môn học" trong file Excel. Vui lòng kiểm tra định dạng file.');
        }
        
        console.log('✅ Phát hiện cấu trúc Excel:', {
          sheet: sheetName,
          headerRow: headerRowIndex,
          columns: {
            name: nameColIndex,
            credits: creditsColIndex, 
            grade: gradeColIndex,
            semester: semesterColIndex
          }
        });
        
        // Tự động tìm các cột nếu chưa được xác định
        if (creditsColIndex === -1 || gradeColIndex === -1) {
          const headerRow = jsonData[headerRowIndex];
          console.log('🔍 Tìm thêm cột từ header row:', headerRow);
          
          for (let j = 0; j < headerRow.length; j++) {
            const cell = String(headerRow[j] || '').toLowerCase().trim();
            if (creditsColIndex === -1 && (cell === 'tín chỉ' || cell.includes('tín chỉ') || cell.includes('credits') || cell === 'tc')) {
              creditsColIndex = j;
              console.log(`✅ Tìm thêm cột tín chỉ tại ${j}: "${headerRow[j]}"`);
            }
            if (gradeColIndex === -1 && (
              cell === 'điểm số' || 
              cell === 'điểm tổng' || 
              cell === 'điểm' ||
              (cell.includes('điểm') && 
               !cell.includes('chữ') && 
               !cell.includes('×') && 
               !cell.includes('chuyên cần') && 
               !cell.includes('quá trình') && 
               !cell.includes('giữa kỳ') && 
               !cell.includes('cuối kỳ') &&
               !cell.includes('gpa'))
            )) {
              gradeColIndex = j;
              console.log(`✅ Tìm thêm cột điểm tại ${j}: "${headerRow[j]}"`);
            }
          }
        }
        
        // Tạo dữ liệu sinh viên mới
        const studentData: StudentRecord = {
          id: generateId(),
          studentName: 'Sinh viên (Import từ Excel)',
          semesters: [],
          cumulativeGPA: 0,
          totalCredits: 0,
          completedCredits: 0,
        };
        
        // Nhóm môn học theo học kỳ
        const semesterMap = new Map<string, Subject[]>();
        
        // Đọc dữ liệu từ các hàng
        console.log('📖 Bắt đầu đọc dữ liệu từ dòng', headerRowIndex + 1);
        let validSubjectsCount = 0;
        
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!Array.isArray(row) || row.length === 0) continue;
          
          const subjectName = String(row[nameColIndex] || '').trim();
          
          // Bỏ qua dòng trống, STT, hoặc dòng header
          if (!subjectName || 
              subjectName.length === 0 || 
              subjectName === 'STT' || 
              /^\d+$/.test(subjectName) ||
              subjectName.toLowerCase().includes('danh sách') ||
              subjectName.toLowerCase().includes('thống kê') ||
              subjectName.toLowerCase().includes('báo cáo')) {
            continue;
          }
          
          console.log(`Dòng ${i}: Xử lý môn "${subjectName}"`);
          
          // Lấy học kỳ
          let semesterName = 'Học kỳ Import';
          if (semesterColIndex !== -1 && row[semesterColIndex]) {
            semesterName = String(row[semesterColIndex]).trim();
          }
          
          // Lấy tín chỉ
          let credits = 3; // Mặc định 3 tín chỉ
          if (creditsColIndex !== -1 && row[creditsColIndex]) {
            const creditsValue = row[creditsColIndex];
            if (typeof creditsValue === 'number') {
              credits = creditsValue;
            } else if (typeof creditsValue === 'string') {
              const parsed = parseInt(creditsValue);
              if (!isNaN(parsed) && parsed > 0) {
                credits = parsed;
              }
            }
          }
          
          // Lấy điểm
          let grade: number | null = null;
          if (gradeColIndex !== -1 && row[gradeColIndex]) {
            const gradeValue = row[gradeColIndex];
            if (typeof gradeValue === 'number') {
              grade = gradeValue;
            } else if (typeof gradeValue === 'string') {
              const parsed = parseFloat(gradeValue);
              if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
                grade = parsed;
              }
            }
          }
          
          // Tạo môn học
          const subject: Subject = {
            id: generateId(),
            name: subjectName,
            credits: credits,
            grade: grade,
          };
          
          console.log(`✅ Thêm môn: ${subjectName} (${credits} TC, điểm: ${grade}) vào ${semesterName}`);
          
          // Thêm vào semester map
          if (!semesterMap.has(semesterName)) {
            semesterMap.set(semesterName, []);
          }
          semesterMap.get(semesterName)!.push(subject);
          validSubjectsCount++;
        }
        
        console.log(`📊 Đã đọc được ${validSubjectsCount} môn học hợp lệ`);
        console.log('Danh sách học kỳ:', Array.from(semesterMap.keys()));
        
        // Tạo các semester từ map
        let semesterIndex = 1;
        for (const [semesterName, subjects] of Array.from(semesterMap.entries())) {
          const semester: Semester = {
            id: generateId(),
            name: semesterName || `Học kỳ ${semesterIndex}`,
            subjects: subjects,
            gpa: calculateSemesterGPA(subjects),
          };
          studentData.semesters.push(semester);
          console.log(`📚 Tạo học kỳ: ${semester.name} với ${subjects.length} môn`);
          semesterIndex++;
        }
        
        // Nếu không có semester nào, tạo một semester mặc định
        if (studentData.semesters.length === 0) {
          console.log('❌ Không có dữ liệu môn học hợp lệ');
          throw new Error('Không tìm thấy dữ liệu môn học nào trong file Excel. Vui lòng kiểm tra lại file và đảm bảo có cột "Tên môn học".');
        }
        
        // Tính toán GPA tích lũy
        studentData.cumulativeGPA = calculateCumulativeGPA(studentData.semesters);
        
        console.log('🎉 Import Excel thành công:', {
          semesters: studentData.semesters.length,
          totalSubjects: studentData.semesters.reduce((sum, sem) => sum + sem.subjects.length, 0),
          cumulativeGPA: studentData.cumulativeGPA.toFixed(3)
        });
        
        resolve(studentData);
      } catch (error) {
        console.error('❌ Lỗi import Excel:', error);
        reject(new Error('Lỗi khi đọc file Excel: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => reject(new Error('Lỗi khi đọc file Excel'));
    reader.readAsBinaryString(file);
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

// Tạo file Excel mẫu để test import
export function createSampleExcel(): void {
  const workbook = XLSX.utils.book_new();
  
  // Tạo data mẫu đơn giản
  const sampleData = [
    ['📋 FILE EXCEL MẪU ĐỂ TEST IMPORT', '', '', '', ''],
    ['', '', '', '', ''],
    ['STT', 'Tên môn học', 'Tín chỉ', 'Điểm số', 'Học kỳ'],
    [1, 'Toán cao cấp A1', 3, 8.5, 'Học kỳ 1'],
    [2, 'Vật lý đại cương', 4, 7.8, 'Học kỳ 1'],
    [3, 'Hóa học đại cương', 3, 8.2, 'Học kỳ 1'],
    [4, 'Lập trình C++', 4, 9.0, 'Học kỳ 2'],
    [5, 'Cấu trúc dữ liệu', 3, 8.7, 'Học kỳ 2'],
    [6, 'Cơ sở dữ liệu', 3, 8.9, 'Học kỳ 2'],
  ];
  
  const sheet = XLSX.utils.aoa_to_sheet(sampleData);
  sheet['!cols'] = [
    { wch: 5 },   // STT
    { wch: 25 },  // Tên môn học
    { wch: 8 },   // Tín chỉ
    { wch: 10 },  // Điểm số
    { wch: 15 },  // Học kỳ
  ];
  
  XLSX.utils.book_append_sheet(workbook, sheet, 'Danh sách môn');
  
  // Xuất file
  XLSX.writeFile(workbook, 'sample-import.xlsx');
  console.log('✅ Đã tạo file sample-import.xlsx để test import');
}

// Export dữ liệu ra file Excel đơn giản để dễ import
export function exportSimpleExcel(data: StudentRecord): void {
  const workbook = XLSX.utils.book_new();
  
  // Tạo data giống hệt file mẫu
  const simpleData = [
    ['📋 BẢNG ĐIỂM SINH VIÊN', '', '', '', ''],
    ['', '', '', '', ''],
    ['STT', 'Tên môn học', 'Tín chỉ', 'Điểm số', 'Học kỳ'],
  ];
  
  let stt = 1;
  data.semesters.forEach((semester) => {
    semester.subjects.forEach((subject) => {
      simpleData.push([
        stt.toString(),
        subject.name,
        subject.credits.toString(),
        subject.grade !== null ? subject.grade.toFixed(1) : '',
        semester.name
      ]);
      stt++;
    });
  });
  
  const sheet = XLSX.utils.aoa_to_sheet(simpleData);
  sheet['!cols'] = [
    { wch: 5 },   // STT
    { wch: 35 },  // Tên môn học
    { wch: 8 },   // Tín chỉ
    { wch: 10 },  // Điểm số
    { wch: 15 },  // Học kỳ
  ];
  
  XLSX.utils.book_append_sheet(workbook, sheet, 'Danh sách môn');
  
  // Xuất file
  const fileName = `bangdiem-simple-${data.studentName.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
  console.log('✅ Đã xuất file Excel đơn giản:', fileName);
}

// Export thời khóa biểu ra Excel
export function exportScheduleToExcel(data: StudentRecord, semesterIndex?: number): void {
  const wb = XLSX.utils.book_new();
  
  // Khung giờ chuẩn
  const timeSlots = [
    { period: 1, startTime: '07:00', endTime: '07:50' },
    { period: 2, startTime: '08:00', endTime: '08:50' },
    { period: 3, startTime: '09:00', endTime: '09:50' },
    { period: 4, startTime: '10:00', endTime: '10:50' },
    { period: 5, startTime: '11:00', endTime: '11:50' },
    { period: 6, startTime: '13:00', endTime: '13:50' },
    { period: 7, startTime: '14:00', endTime: '14:50' },
    { period: 8, startTime: '15:00', endTime: '15:50' },
    { period: 9, startTime: '16:00', endTime: '16:50' },
    { period: 10, startTime: '17:00', endTime: '17:50' },
    { period: 11, startTime: '18:00', endTime: '18:50' },
    { period: 12, startTime: '19:00', endTime: '19:50' },
  ];

  const days = [
    { key: 1, name: 'Thứ 2', short: 'T2' },
    { key: 2, name: 'Thứ 3', short: 'T3' },
    { key: 3, name: 'Thứ 4', short: 'T4' },
    { key: 4, name: 'Thứ 5', short: 'T5' },
    { key: 5, name: 'Thứ 6', short: 'T6' },
    { key: 6, name: 'Thứ 7', short: 'T7' },
    { key: 0, name: 'Chủ nhật', short: 'CN' },
  ];

  const classTypes = {
    'lecture': 'Lý thuyết',
    'lab': 'Thực hành', 
    'tutorial': 'Bài tập',
    'exam': 'Thi/KT'
  };

  // Lấy danh sách học kỳ cần export
  const semestersToExport = semesterIndex !== undefined 
    ? [data.semesters[semesterIndex]]
    : data.semesters;

  semestersToExport.forEach((semester, index) => {
    // Tạo lưới thời khóa biểu
    const scheduleGrid: string[][] = [];
    
    // Header row
    const headerRow = ['Tiết / Thứ', ...days.map(d => d.name)];
    scheduleGrid.push(headerRow);
    
    // Tạo ma trận thời khóa biểu
    timeSlots.forEach(slot => {
      const row = [`Tiết ${slot.period}\n(${slot.startTime}-${slot.endTime})`];
      
      days.forEach(day => {
        let cellContent = '';
        
        // Tìm các môn học trong khung giờ này
        semester.subjects.forEach(subject => {
          if (subject.schedule) {
            subject.schedule.forEach(classSchedule => {
              if (classSchedule.dayOfWeek === day.key) {
                // Kiểm tra xem lịch này có trong khung giờ hiện tại không
                const scheduleStartTime = classSchedule.startTime;
                const scheduleEndTime = classSchedule.endTime;
                
                // Nếu khung giờ này nằm trong khoảng thời gian của lịch học
                if (scheduleStartTime <= slot.startTime && slot.endTime <= scheduleEndTime) {
                  const typeText = classTypes[classSchedule.type as keyof typeof classTypes] || classSchedule.type;
                  const roomText = classSchedule.room ? ` - ${classSchedule.room}` : '';
                  const instructorText = classSchedule.instructor ? `\nGV: ${classSchedule.instructor}` : '';
                  
                  cellContent += `${subject.name} (${typeText})${roomText}${instructorText}\n`;
                }
              }
            });
          }
        });
        
        row.push(cellContent.trim() || '');
      });
      
      scheduleGrid.push(row);
    });
    
    // Tạo worksheet cho thời khóa biểu lưới
    const wsGrid = XLSX.utils.aoa_to_sheet(scheduleGrid);
    
    // Thiết lập độ rộng cột
    wsGrid['!cols'] = [
      { wch: 15 }, // Cột tiết học
      { wch: 25 }, // Thứ 2
      { wch: 25 }, // Thứ 3
      { wch: 25 }, // Thứ 4
      { wch: 25 }, // Thứ 5
      { wch: 25 }, // Thứ 6
      { wch: 25 }, // Thứ 7
      { wch: 25 }, // Chủ nhật
    ];

    // Thiết lập chiều cao hàng
    wsGrid['!rows'] = scheduleGrid.map(() => ({ hpt: 60 }));
    
    const gridSheetName = semesterIndex !== undefined 
      ? `TKB Lưới`
      : `TKB Lưới - ${semester.name}`;
    XLSX.utils.book_append_sheet(wb, wsGrid, gridSheetName);

    // Tạo sheet danh sách chi tiết
    const detailData: any[] = [];
    
    semester.subjects.forEach(subject => {
      if (subject.schedule && subject.schedule.length > 0) {
        subject.schedule.forEach(classSchedule => {
          const dayName = days.find(d => d.key === classSchedule.dayOfWeek)?.name || 'Không xác định';
          const typeText = classTypes[classSchedule.type as keyof typeof classTypes] || classSchedule.type;
          
          detailData.push({
            'Tên môn học': subject.name,
            'Tín chỉ': subject.credits,
            'Thứ': dayName,
            'Giờ bắt đầu': classSchedule.startTime,
            'Giờ kết thúc': classSchedule.endTime,
            'Phòng học': classSchedule.room || '',
            'Tòa nhà': classSchedule.building || '',
            'Loại tiết': typeText,
            'Giảng viên': classSchedule.instructor || '',
            'Ghi chú': classSchedule.note || ''
          });
        });
      }
    });

    if (detailData.length > 0) {
      const wsDetail = XLSX.utils.json_to_sheet(detailData);
      wsDetail['!cols'] = [
        { wch: 25 }, // Tên môn học
        { wch: 8 },  // Tín chỉ
        { wch: 10 }, // Thứ
        { wch: 12 }, // Giờ bắt đầu
        { wch: 12 }, // Giờ kết thúc
        { wch: 15 }, // Phòng học
        { wch: 15 }, // Tòa nhà
        { wch: 12 }, // Loại tiết
        { wch: 20 }, // Giảng viên
        { wch: 20 }  // Ghi chú
      ];
      
      const detailSheetName = semesterIndex !== undefined 
        ? `TKB Chi tiết`
        : `TKB Chi tiết - ${semester.name}`;
      XLSX.utils.book_append_sheet(wb, wsDetail, detailSheetName);
    }
  });

  // Tạo sheet thống kê
  const statsData = [
    ['📅 THỐNG KÊ THỜI KHÓA BIỂU', ''],
    ['Sinh viên:', data.studentName || 'Sinh viên'],
    ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
    ['', ''],
    ['Thống kê theo học kỳ:', ''],
    ['Học kỳ', 'Số môn', 'Số lịch học', 'Số tiết/tuần'],
  ];

  semestersToExport.forEach(semester => {
    const totalSchedules = semester.subjects.reduce((total, subject) => 
      total + (subject.schedule?.length || 0), 0
    );
    
    // Tính số tiết trong tuần (mỗi lịch học là 1 khoảng thời gian, có thể nhiều tiết)
    const totalPeriods = semester.subjects.reduce((total, subject) => {
      if (subject.schedule) {
        return total + subject.schedule.reduce((subTotal, schedule) => {
          // Tính số tiết dựa trên khoảng thời gian
          const startTime = schedule.startTime;
          const endTime = schedule.endTime;
          
          const getMinutes = (timeStr: string) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
          };
          
          const duration = getMinutes(endTime) - getMinutes(startTime);
          const periods = Math.ceil(duration / 50); // Mỗi tiết 50 phút
          
          return subTotal + periods;
        }, 0);
      }
      return total;
    }, 0);

    statsData.push([
      semester.name,
      semester.subjects.length.toString(),
      totalSchedules.toString(),
      totalPeriods.toString()
    ]);
  });

  const wsStats = XLSX.utils.aoa_to_sheet(statsData);
  wsStats['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsStats, 'Thống kê');

  // Xuất file
  const semesterText = semesterIndex !== undefined 
    ? `_${semestersToExport[0].name.replace(/[^a-zA-Z0-9]/g, '')}`
    : '_TatCaHocKy';
  
  const fileName = `ThoiKhoaBieu_${data.studentName || 'SinhVien'}${semesterText}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
  
  console.log('✅ Đã xuất thời khóa biểu ra Excel:', fileName);
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
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = Array(7).fill({ wch: 20 });
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng quan');
  
  // 2. SHEET DANH SÁCH MÔN - Định dạng đơn giản như file mẫu
  const allSubjectsData = [
    ['📋 DANH SÁCH TẤT CẢ CÁC MÔN HỌC', '', '', '', ''],
    ['', '', '', '', ''],
    ['STT', 'Tên môn học', 'Tín chỉ', 'Điểm số', 'Học kỳ'],
  ];
  
  let stt = 1;
  data.semesters.forEach((semester) => {
    semester.subjects.forEach((subject) => {
      allSubjectsData.push([
        stt.toString(),
        subject.name,
        subject.credits.toString(),
        subject.grade !== null ? subject.grade.toFixed(1) : '',
        semester.name
      ]);
      stt++;
    });
  });
  
  const allSubjectsSheet = XLSX.utils.aoa_to_sheet(allSubjectsData);
  allSubjectsSheet['!cols'] = [
    { wch: 5 },   // STT
    { wch: 35 },  // Tên môn học
    { wch: 8 },   // Tín chỉ
    { wch: 10 },  // Điểm số
    { wch: 15 },  // Học kỳ
  ];
  XLSX.utils.book_append_sheet(workbook, allSubjectsSheet, 'Danh sách môn');
  
  // Xuất file
  const fileName = `BangDiem_${data.studentName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
  
  console.log('✅ Đã xuất file Excel với đầy đủ thông tin:', fileName);
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
          backup._backupKey = key; // Thêm key để có thể xóa backup
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