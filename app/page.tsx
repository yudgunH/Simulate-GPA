'use client';

import { useState, useEffect } from 'react';
import { Subject, Semester, StudentRecord, GPASettings, ClassSchedule } from '@/types';
import { 
  calculateSemesterGPA, 
  calculateCumulativeGPA, 
  getAcademicLevel, 
  getScholarships,
  getImprovementSuggestions,
  DEFAULT_GPA_SETTINGS 
} from '@/utils/gpa';
import { 
  saveData, 
  loadData, 
  createDefaultData, 
  exportData, 
  importData, 
  importFromExcel,
  generateId,
  exportSimpleExcel,
  exportScheduleToExcel,
  saveDataWithBackup,
  getStorageStats,
  restoreFromBackup
} from '@/utils/storage';
import SimulationModal from '@/components/SimulationModal';
import GPASettingsModal from '@/components/GPASettingsModal';
import BackupModal from '@/components/BackupModal';
import ScheduleModal from '@/components/ScheduleModal';

export default function HomePage() {
  const [studentData, setStudentData] = useState<StudentRecord>(createDefaultData());
  const [currentSemesterIndex, setCurrentSemesterIndex] = useState(0);
  const [showSimulation, setShowSimulation] = useState(false);
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const [showGPASettings, setShowGPASettings] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [editingSemester, setEditingSemester] = useState<{id: string, name: string} | null>(null);

  // Load data on mount
  useEffect(() => {
    const saved = loadData();
    if (saved) {
      setStudentData(saved);
      console.log('✅ Đã tải dữ liệu từ localStorage:', saved);
    } else {
      console.log('ℹ️ Không có dữ liệu trong localStorage, sử dụng dữ liệu mặc định');
    }
    setIsLoaded(true);
  }, []);

  // Save data whenever it changes (nhưng chỉ sau khi đã load xong)
  useEffect(() => {
    if (isLoaded) {
      setSaveStatus('saving');
      try {
        saveDataWithBackup(studentData);
        console.log('💾 Đã lưu dữ liệu vào localStorage');
        setSaveStatus('saved');
        
        // Reset về saved sau 2 giây
        setTimeout(() => setSaveStatus('saved'), 2000);
      } catch (error) {
        console.error('❌ Lỗi khi lưu:', error);
        setSaveStatus('error');
      }
    }
  }, [studentData, isLoaded]);

  const currentSemester = studentData.semesters[currentSemesterIndex];
  const gpaSettings = studentData.gpaSettings || DEFAULT_GPA_SETTINGS;
  const semesterGPA = calculateSemesterGPA(currentSemester.subjects, gpaSettings);
  const cumulativeGPA = calculateCumulativeGPA(studentData.semesters, gpaSettings);
  const academicLevel = getAcademicLevel(cumulativeGPA, gpaSettings);
  const scholarships = getScholarships(gpaSettings);
  const suggestions = getImprovementSuggestions(cumulativeGPA, currentSemester.subjects, gpaSettings);

  // Add new subject
  const addSubject = () => {
    const newSubject: Subject = {
      id: generateId(),
      name: 'Môn học mới',
      credits: 3,
      grade: null,
    };

    setStudentData(prev => ({
      ...prev,
      semesters: prev.semesters.map((sem, index) => 
        index === currentSemesterIndex 
          ? { ...sem, subjects: [...sem.subjects, newSubject] }
          : sem
      ),
    }));
  };

  // Update subject
  const updateSubject = (subjectId: string, field: keyof Subject, value: string | number) => {
    setStudentData(prev => ({
      ...prev,
      semesters: prev.semesters.map((sem, index) => 
        index === currentSemesterIndex 
          ? {
              ...sem,
              subjects: sem.subjects.map(sub => 
                sub.id === subjectId 
                  ? { ...sub, [field]: field === 'grade' ? (value === '' ? null : Number(value)) : value }
                  : sub
              ),
            }
          : sem
      ),
    }));
  };

  // Delete subject
  const deleteSubject = (subjectId: string) => {
    setStudentData(prev => ({
      ...prev,
      semesters: prev.semesters.map((sem, index) => 
        index === currentSemesterIndex 
          ? { ...sem, subjects: sem.subjects.filter(sub => sub.id !== subjectId) }
          : sem
      ),
    }));
  };

  // Add new semester
  const addSemester = () => {
    const newSemester: Semester = {
      id: generateId(),
      name: `Học kỳ ${studentData.semesters.length + 1}`,
      subjects: [],
      gpa: 0,
    };

    setStudentData(prev => ({
      ...prev,
      semesters: [...prev.semesters, newSemester],
    }));
    setCurrentSemesterIndex(studentData.semesters.length);
  };

  // Update semester name
  const updateSemesterName = (semesterId: string, newName: string) => {
    if (!newName.trim()) {
      alert('Tên học kỳ không được để trống!');
      return;
    }

    setStudentData(prev => ({
      ...prev,
      semesters: prev.semesters.map(sem => 
        sem.id === semesterId 
          ? { ...sem, name: newName.trim() }
          : sem
      ),
    }));
    setEditingSemester(null);
  };

  // Delete semester
  const deleteSemester = (semesterIndex: number) => {
    const semester = studentData.semesters[semesterIndex];
    
    // Xác nhận xóa
    const confirmMessage = semester.subjects.length > 0 
      ? `Bạn có chắc muốn xóa "${semester.name}"?\nHọc kỳ này có ${semester.subjects.length} môn học, tất cả sẽ bị xóa!`
      : `Bạn có chắc muốn xóa "${semester.name}"?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    const newSemesters = studentData.semesters.filter((_, index) => index !== semesterIndex);
    
    // Không cho xóa nếu chỉ còn 1 học kỳ
    if (newSemesters.length === 0) {
      alert('Không thể xóa học kỳ cuối cùng! Phải có ít nhất 1 học kỳ.');
      return;
    }

    setStudentData(prev => ({
      ...prev,
      semesters: newSemesters,
    }));

    // Điều chỉnh currentSemesterIndex nếu cần
    if (currentSemesterIndex >= newSemesters.length) {
      setCurrentSemesterIndex(newSemesters.length - 1);
    } else if (currentSemesterIndex > semesterIndex) {
      setCurrentSemesterIndex(currentSemesterIndex - 1);
    }
  };

  // Duplicate semester
  const duplicateSemester = (semesterIndex: number) => {
    const semesterToDuplicate = studentData.semesters[semesterIndex];
    const newSemester: Semester = {
      id: generateId(),
      name: `${semesterToDuplicate.name} (Sao chép)`,
      subjects: semesterToDuplicate.subjects.map(subject => ({
        ...subject,
        id: generateId(),
        grade: null, // Reset điểm về null để nhập lại
      })),
      gpa: 0,
    };

    setStudentData(prev => ({
      ...prev,
      semesters: [...prev.semesters, newSemester],
    }));
    setCurrentSemesterIndex(studentData.semesters.length);
  };

  // Handle GPA settings save
  const handleGPASettingsSave = (newSettings: GPASettings) => {
    setStudentData(prev => ({
      ...prev,
      gpaSettings: newSettings
    }));
  };

  // Handle backup restore
  const handleBackupRestore = (backupData: StudentRecord) => {
    setStudentData(backupData);
    setCurrentSemesterIndex(0); // Reset về học kỳ đầu tiên
    alert('Đã khôi phục backup thành công! 🎉');
  };

  // Handle schedule update for subject
  const handleScheduleUpdate = (subjectId: string, schedule: ClassSchedule[]) => {
    setStudentData(prev => ({
      ...prev,
      semesters: prev.semesters.map((sem, index) => 
        index === currentSemesterIndex 
          ? {
              ...sem,
              subjects: sem.subjects.map(sub => 
                sub.id === subjectId 
                  ? { ...sub, schedule }
                  : sub
              ),
            }
          : sem
      ),
    }));
  };

  // Handle file import
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        let data: StudentRecord;
        
        // Kiểm tra loại file
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          // Import file Excel
          data = await importFromExcel(file);
        } else if (fileName.endsWith('.json')) {
          // Import file JSON
          data = await importData(file);
        } else {
          throw new Error('Định dạng file không được hỗ trợ. Chỉ hỗ trợ file .xlsx, .xls hoặc .json');
        }
        
        setStudentData(data);
        setCurrentSemesterIndex(0);
        alert('Import dữ liệu thành công! 🎉');
      } catch (error) {
        alert('Lỗi import: ' + (error as Error).message);
      }
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          📊 Simulate GPA
        </h1>
        <p className="text-lg text-gray-600">
          Tính toán GPA và mô phỏng kết quả học tập - trước khi bảng điểm thật xuất hiện! 🎓
        </p>
        
        {/* Save Status Indicator */}
        <div className="mt-2">
          {saveStatus === 'saving' && (
            <span className="text-blue-600 text-sm">💾 Đang lưu...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-green-600 text-sm">✅ Đã lưu tự động</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-600 text-sm">❌ Lỗi lưu dữ liệu</span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button 
          onClick={() => exportSimpleExcel(studentData)}
          className="btn-primary flex items-center gap-2"
        >
          📊 Xuất Excel
        </button>
        <button 
          onClick={() => exportData(studentData)}
          className="btn-secondary flex items-center gap-2"
        >
          📥 Xuất JSON
        </button>
        <label className="btn-secondary flex items-center gap-2 cursor-pointer">
          📤 Nhập file (JSON/Excel)
          <input 
            type="file" 
            accept=".json,.xlsx,.xls" 
            onChange={handleImport}
            className="hidden"
          />
        </label>

        <button 
          onClick={() => setShowSimulation(true)}
          className="btn-secondary flex items-center gap-2"
        >
          🎯 Mô phỏng kết quả
        </button>
        <button 
          onClick={() => setShowStorageInfo(!showStorageInfo)}
          className="btn-secondary flex items-center gap-2"
        >
          💾 Thông tin lưu trữ
        </button>
        <button 
          onClick={() => setShowGPASettings(true)}
          className="btn-secondary flex items-center gap-2"
        >
          ⚙️ Cấu hình thang đo
        </button>
        <button 
          onClick={() => setShowSchedule(true)}
          className="btn-secondary flex items-center gap-2"
        >
          📅 Thời khóa biểu
        </button>
        <button 
          onClick={() => exportScheduleToExcel(studentData, currentSemesterIndex)}
          className="btn-secondary flex items-center gap-2"
          disabled={!currentSemester.subjects.some(s => s.schedule && s.schedule.length > 0)}
          title="Xuất thời khóa biểu học kỳ hiện tại ra Excel"
        >
          📊 Xuất TKB Excel
        </button>
        <button 
          onClick={() => setShowAbout(true)}
          className="btn-secondary flex items-center gap-2"
          title="Thông tin về tác giả và ứng dụng"
        >
          👨‍💻 Về tác giả
        </button>
      </div>

      {/* Storage Info Panel */}
      {showStorageInfo && (
        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700">
            💾 Thông tin lưu trữ localStorage
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">📊 Dung lượng dữ liệu:</span> {getStorageStats().dataSize}
              </div>
              <div className="text-sm">
                <span className="font-medium">🔄 Số backup:</span> {getStorageStats().backupCount}
              </div>
              <div className="text-sm">
                <span className="font-medium">💽 Tổng dung lượng:</span> {getStorageStats().totalSize}
              </div>
              <div className="text-sm">
                <span className="font-medium">⏰ Lần lưu cuối:</span> {getStorageStats().lastSaved}
              </div>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => setShowBackup(true)}
                className="btn-secondary text-sm w-full"
              >
                🔄 Xem backup
              </button>
              <button 
                onClick={() => {
                  console.clear();
                  console.log('🔍 === DEBUG STORAGE INFO ===');
                  console.log('📊 Current studentData:', studentData);
                  console.log('📋 localStorage raw data:', localStorage.getItem('simulate-gpa-data'));
                  console.log('📈 Storage stats:', getStorageStats());
                  console.log('🔄 Available backups:', restoreFromBackup());
                  console.log('🗂️ All localStorage keys:', Object.keys(localStorage));
                  console.log('💾 GPA Settings:', studentData.gpaSettings);
                  console.log('🎯 Current semester index:', currentSemesterIndex);
                  console.log('📚 Total subjects across all semesters:', 
                    studentData.semesters.reduce((total, sem) => total + sem.subjects.length, 0)
                  );
                  console.log('⭐ Calculated GPA:', {
                    semesterGPA,
                    cumulativeGPA,
                    academicLevel: academicLevel.level
                  });
                  console.log('=== END DEBUG INFO ===');
                  
                  // Tạo một modal thông báo với thông tin debug tóm tắt
                  const debugInfo = `
📊 Thông tin Debug:
• Sinh viên: ${studentData.studentName}
• Số học kỳ: ${studentData.semesters.length}
• Tổng môn học: ${studentData.semesters.reduce((total, sem) => total + sem.subjects.length, 0)}
• GPA tích lũy: ${cumulativeGPA.toFixed(3)}
• Thang đo: ${studentData.gpaSettings?.maxGPA || 4.0}
• Số backup: ${getStorageStats().backupCount}
• Dung lượng: ${getStorageStats().totalSize}

🔍 Chi tiết đầy đủ đã được in ra Console (F12)
                  `;
                  alert(debugInfo);
                }}
                className="btn-secondary text-sm w-full"
              >
                🔍 Debug storage
              </button>
              <button 
                onClick={() => {
                  if (confirm('Bạn có chắc muốn xóa tất cả dữ liệu?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="btn-secondary text-sm w-full text-red-600 hover:bg-red-50"
              >
                🗑️ Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column: Input form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Semester selection */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                📚 Quản lý học kỳ
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={addSemester}
                  className="btn-primary text-sm flex items-center gap-1"
                >
                  ➕ Thêm
                </button>
                <button 
                  onClick={() => duplicateSemester(currentSemesterIndex)}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  📋 Sao chép
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {studentData.semesters.map((semester, index) => (
                <div
                  key={semester.id}
                  onClick={() => setCurrentSemesterIndex(index)}
                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    index === currentSemesterIndex
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-gray-50 hover:border-primary-200 hover:bg-primary-25'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`flex items-center gap-2 font-medium ${
                        index === currentSemesterIndex
                          ? 'text-primary-700'
                          : 'text-gray-700'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          index === currentSemesterIndex
                            ? 'bg-primary-500'
                            : 'bg-gray-400'
                        }`}></span>
                        {editingSemester?.id === semester.id ? (
                          <input
                            type="text"
                            value={editingSemester.name}
                            onChange={(e) => setEditingSemester({...editingSemester, name: e.target.value})}
                            onBlur={() => updateSemesterName(semester.id, editingSemester.name)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateSemesterName(semester.id, editingSemester.name);
                              } else if (e.key === 'Escape') {
                                setEditingSemester(null);
                              }
                            }}
                            className="input-field text-sm py-1 px-2 min-w-0 flex-1"
                            autoFocus
                          />
                        ) : (
                          semester.name
                        )}
                      </div>
                      
                      {index === currentSemesterIndex && (
                        <div className="flex gap-2">
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                            {semester.subjects.length} môn
                          </span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            {semester.subjects.reduce((total, sub) => total + (sub.schedule?.length || 0), 0)} lịch
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSemester({id: semester.id, name: semester.name});
                        }}
                        className="p-1 text-gray-500 hover:text-blue-600 rounded transition-colors"
                        title="Sửa tên học kỳ"
                      >
                        ✏️
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateSemester(index);
                        }}
                        className="p-1 text-gray-500 hover:text-green-600 rounded transition-colors"
                        title="Sao chép học kỳ"
                      >
                        📋
                      </button>
                      
                      {studentData.semesters.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSemester(index);
                          }}
                          className="p-1 text-gray-500 hover:text-red-600 rounded transition-colors"
                          title="Xóa học kỳ"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subject input table */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                🧮 Bảng điểm {currentSemester.name}
              </h2>
              <button 
                onClick={addSubject}
                className="btn-primary flex items-center gap-2"
              >
                ➕ Thêm môn
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 border-b font-medium">Tên môn học</th>
                    <th className="text-left p-3 border-b font-medium">Tín chỉ</th>
                    <th className="text-left p-3 border-b font-medium">Điểm</th>
                    <th className="text-left p-3 border-b font-medium">Lịch học</th>
                    <th className="text-left p-3 border-b font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSemester.subjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-gray-50">
                      <td className="p-3 border-b">
                        <input
                          type="text"
                          value={subject.name}
                          onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                          className="input-field"
                          placeholder="Tên môn học"
                        />
                      </td>
                      <td className="p-3 border-b">
                        <input
                          type="number"
                          value={subject.credits}
                          onChange={(e) => updateSubject(subject.id, 'credits', Number(e.target.value))}
                          className="input-field"
                          min="1"
                          max="6"
                        />
                      </td>
                      <td className="p-3 border-b">
                        <input
                          type="number"
                          value={subject.grade ?? ''}
                          onChange={(e) => updateSubject(subject.id, 'grade', e.target.value)}
                          className="input-field"
                          placeholder="0-10"
                          min="0"
                          max="10"
                          step="0.1"
                        />
                      </td>
                      <td className="p-3 border-b">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {subject.schedule?.length || 0} lịch
                          </span>
                          <button
                            onClick={() => setShowSchedule(true)}
                            className="text-blue-600 hover:text-blue-800 p-1 text-sm"
                            title="Xem/Chỉnh sửa lịch học"
                          >
                            📅
                          </button>
                        </div>
                      </td>
                      <td className="p-3 border-b">
                        <button
                          onClick={() => deleteSubject(subject.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {currentSemester.subjects.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Chưa có môn học nào. Hãy thêm môn học để bắt đầu!
              </div>
            )}
          </div>
        </div>

        {/* Right column: Results */}
        <div className="space-y-6">
          {/* GPA Results */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🏆 Kết quả GPA
            </h3>
            
            <div className="space-y-4">
              <div className="text-center p-4 bg-primary-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-700">
                  {semesterGPA.toFixed(2)}
                </div>
                <div className="text-sm text-primary-600">GPA học kỳ này</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {cumulativeGPA.toFixed(2)}
                </div>
                <div className="text-sm text-green-600">GPA tích lũy</div>
              </div>
              
              <div className={`text-center p-4 rounded-lg bg-gray-50`}>
                <div className={`text-lg font-semibold ${academicLevel.color}`}>
                  {academicLevel.level}
                </div>
                <div className="text-sm text-gray-600">Học lực hiện tại</div>
              </div>
            </div>
          </div>

          {/* Academic Performance Status */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">🎓 Tình trạng học lực</h3>
            <div className="space-y-3">
              <div className={`p-4 rounded-lg border-2 ${academicLevel.color.includes('purple') ? 'bg-purple-50 border-purple-200' :
                academicLevel.color.includes('blue') ? 'bg-blue-50 border-blue-200' :
                academicLevel.color.includes('green') ? 'bg-green-50 border-green-200' :
                academicLevel.color.includes('yellow') ? 'bg-yellow-50 border-yellow-200' :
                academicLevel.color.includes('orange') ? 'bg-orange-50 border-orange-200' :
                'bg-red-50 border-red-200'}`}>
                <div className={`text-xl font-bold ${academicLevel.color}`}>
                  {academicLevel.level}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  GPA: {cumulativeGPA.toFixed(3)} (Thang {gpaSettings.maxGPA})
                </div>
                <div className="text-sm text-gray-600">
                  Khoảng: {academicLevel.minGPA.toFixed(1)} - {academicLevel.maxGPA.toFixed(1)}
                </div>
              </div>
              
              {/* Scholarship eligibility as sub-section */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">🏆 Đủ điều kiện học bổng:</h4>
                <div className="space-y-1">
                  {scholarships.map((scholarship) => (
                    <div 
                      key={scholarship.name}
                      className={`p-2 rounded text-sm ${
                        cumulativeGPA >= scholarship.minGPA 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      <span className="font-medium">{scholarship.name}</span>
                      <span className="ml-2">
                        {cumulativeGPA >= scholarship.minGPA ? '✅' : '❌'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📈 Gợi ý cải thiện
            </h3>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg text-blue-700 text-sm">
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Modal */}
      <SimulationModal
        isOpen={showSimulation}
        onClose={() => setShowSimulation(false)}
        subjects={currentSemester.subjects}
        currentGPA={cumulativeGPA}
      />

      {/* GPA Settings Modal */}
      <GPASettingsModal
        isOpen={showGPASettings}
        onClose={() => setShowGPASettings(false)}
        currentSettings={gpaSettings}
        onSave={handleGPASettingsSave}
      />

      {/* Backup Modal */}
      <BackupModal
        isOpen={showBackup}
        onClose={() => setShowBackup(false)}
        onRestore={handleBackupRestore}
      />

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        subjects={currentSemester.subjects}
        onUpdateSubject={handleScheduleUpdate}
        studentData={studentData}
        currentSemesterIndex={currentSemesterIndex}
      />

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  👨‍💻 Về tác giả & Ứng dụng
                </h2>
                <button
                  onClick={() => setShowAbout(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {/* App Info */}
                <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-4xl mb-3">📊</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Simulate GPA</h3>
                  <p className="text-gray-600">
                    Ứng dụng tính toán và mô phỏng GPA học tập
                  </p>
                  <div className="mt-3 flex justify-center gap-2 text-sm">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">v2.0.0</span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Next.js 14</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">TypeScript</span>
                  </div>
                </div>

                {/* Developer Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      🚀 Tính năng nổi bật
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✅</span>
                        6 thang đo GPA tùy chỉnh
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✅</span>
                        Thời khóa biểu đầy đủ
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✅</span>
                        Phát hiện xung đột lịch học
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✅</span>
                        Export Excel chuyên nghiệp
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✅</span>
                        Backup tự động & an toàn
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✅</span>
                        Mô phỏng kết quả thông minh
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      🛠️ Công nghệ
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Framework:</span>
                        <span className="font-medium">Next.js 14</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Language:</span>
                        <span className="font-medium">TypeScript</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Styling:</span>
                        <span className="font-medium">Tailwind CSS</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Storage:</span>
                        <span className="font-medium">localStorage</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Export:</span>
                        <span className="font-medium">XLSX.js</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Developer */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    👨‍💻 Nhà phát triển
                  </h4>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      👤
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-800 mb-2">Vietnamese Developer</h5>
                      <p className="text-sm text-gray-600 mb-3">
                        Passionate fullstack developer focused on creating useful educational tools for Vietnamese students. 
                        Specialized in React, Next.js, and modern web technologies.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">React</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Next.js</span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">TypeScript</span>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Node.js</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">2.0</div>
                    <div className="text-xs text-blue-600">Version</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">6</div>
                    <div className="text-xs text-green-600">Thang đo GPA</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">15+</div>
                    <div className="text-xs text-purple-600">Tính năng</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">100%</div>
                    <div className="text-xs text-orange-600">Miễn phí</div>
                  </div>
                </div>

                {/* Links */}
                <div className="border-t pt-4">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button 
                      onClick={() => window.open('https://github.com/yudgunH', '_blank')}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      🐙 GitHub
                    </button>
                    <button 
                      onClick={() => window.open('mailto:ndhung0901@gmail.com', '_blank')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      📧 Liên hệ
                    </button>
                    <button 
                      onClick={() => {
                        alert('⭐ Cảm ơn bạn đã sử dụng Simulate GPA!\n\nNếu ứng dụng hữu ích, hãy chia sẻ cho bạn bè nhé! 🎓');
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                    >
                      ⭐ Đánh giá
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500 border-t pt-4">
                  <p>Made with ❤️ for Vietnamese Students</p>
                  <p className="mt-1">© 2024 Simulate GPA - Open Source Project</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* App Info */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                📊 Simulate GPA
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Ứng dụng tính toán và mô phỏng GPA học tập hiện đại, 
                giúp sinh viên quản lý điểm số và lập kế hoạch học tập hiệu quả.
              </p>
              <div className="flex gap-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">v2.0.0</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Free</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Open Source</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">🔗 Liên kết nhanh</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <button 
                    onClick={() => setShowAbout(true)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    📖 Về ứng dụng
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowGPASettings(true)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    ⚙️ Cấu hình thang đo
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowBackup(true)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    💾 Quản lý backup
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowSchedule(true)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    📅 Thời khóa biểu
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact & Support */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">💬 Hỗ trợ</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span>📧</span>
                  <span>ndhung0901@gmail.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>🐙</span>
                  <span>https://github.com/yudgunH</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>🌟</span>
                  <span>Made with ❤️ in Vietnam</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>⚡</span>
                  <span>Next.js + TypeScript</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-300 mt-6 pt-6 text-center">
            <p className="text-sm text-gray-500">
              © 2025 Simulate GPA. Made with ❤️ by Vietnamese Developer for Vietnamese Students.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Open source project - Dự án mã nguồn mở phục vụ cộng đồng sinh viên Việt Nam
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}


