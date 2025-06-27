'use client';

import { useState, useEffect } from 'react';
import { Subject, Semester, StudentRecord } from '@/types';
import { 
  calculateSemesterGPA, 
  calculateCumulativeGPA, 
  getAcademicLevel, 
  SCHOLARSHIPS,
  getImprovementSuggestions 
} from '@/utils/gpa';
import { 
  saveData, 
  loadData, 
  createDefaultData, 
  exportData, 
  importData, 
  generateId,
  exportToExcel,
  saveDataWithBackup,
  getStorageStats,
  restoreFromBackup
} from '@/utils/storage';
import SimulationModal from '@/components/SimulationModal';

export default function HomePage() {
  const [studentData, setStudentData] = useState<StudentRecord>(createDefaultData());
  const [currentSemesterIndex, setCurrentSemesterIndex] = useState(0);
  const [showSimulation, setShowSimulation] = useState(false);
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

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
  const semesterGPA = calculateSemesterGPA(currentSemester.subjects);
  const cumulativeGPA = calculateCumulativeGPA(studentData.semesters);
  const academicLevel = getAcademicLevel(cumulativeGPA);
  const suggestions = getImprovementSuggestions(cumulativeGPA, currentSemester.subjects);

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

  // Handle file import
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const data = await importData(file);
        setStudentData(data);
        setCurrentSemesterIndex(0);
        alert('Import dữ liệu thành công!');
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
          onClick={() => exportToExcel(studentData)}
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
          📤 Nhập file
          <input 
            type="file" 
            accept=".json" 
            onChange={handleImport}
            className="hidden"
          />
        </label>
        <button 
          onClick={addSemester}
          className="btn-secondary flex items-center gap-2"
        >
          ➕ Thêm học kỳ
        </button>
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
                onClick={() => {
                  const backups = restoreFromBackup();
                  if (backups.length > 0) {
                    alert(`Có ${backups.length} backup. Chức năng khôi phục sẽ được bổ sung.`);
                  } else {
                    alert('Không có backup nào.');
                  }
                }}
                className="btn-secondary text-sm w-full"
              >
                🔄 Xem backup
              </button>
              <button 
                onClick={() => {
                  console.log('🔍 Debug localStorage:');
                  console.log('Current studentData:', studentData);
                  console.log('localStorage content:', localStorage.getItem('simulate-gpa-data'));
                  console.log('Storage stats:', getStorageStats());
                  alert('Kiểm tra console (F12) để xem thông tin debug!');
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
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📚 Chọn học kỳ
            </h2>
            <div className="flex flex-wrap gap-2">
              {studentData.semesters.map((semester, index) => (
                <button
                  key={semester.id}
                  onClick={() => setCurrentSemesterIndex(index)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    index === currentSemesterIndex
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {semester.name}
                </button>
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

          {/* Scholarship Status */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">🏆 Tình trạng học bổng</h3>
            <div className="space-y-2">
              {SCHOLARSHIPS.map((scholarship) => (
                <div 
                  key={scholarship.name}
                  className={`p-3 rounded-lg ${
                    cumulativeGPA >= scholarship.minGPA 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <div className="font-medium">{scholarship.name}</div>
                  <div className="text-sm">
                    Yêu cầu: GPA ≥ {scholarship.minGPA}
                    {cumulativeGPA >= scholarship.minGPA ? ' ✅' : ' ❌'}
                  </div>
                </div>
              ))}
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
    </div>
  );
}

