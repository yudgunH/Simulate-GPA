'use client';

import { useState, useEffect } from 'react';
import { Subject, ClassSchedule, WeekSchedule, StudentRecord } from '@/types';
import { generateId, exportScheduleToExcel } from '@/utils/storage';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onUpdateSubject: (subjectId: string, schedule: ClassSchedule[]) => void;
  studentData?: StudentRecord;
  currentSemesterIndex?: number;
}

const TIME_SLOTS = [
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

const DAYS = [
  { key: 1, name: 'Thứ 2', short: 'T2' },
  { key: 2, name: 'Thứ 3', short: 'T3' },
  { key: 3, name: 'Thứ 4', short: 'T4' },
  { key: 4, name: 'Thứ 5', short: 'T5' },
  { key: 5, name: 'Thứ 6', short: 'T6' },
  { key: 6, name: 'Thứ 7', short: 'T7' },
  { key: 0, name: 'Chủ nhật', short: 'CN' },
];

const CLASS_TYPES = [
  { key: 'lecture', name: 'Lý thuyết', color: 'bg-blue-100 text-blue-800' },
  { key: 'lab', name: 'Thực hành', color: 'bg-green-100 text-green-800' },
  { key: 'tutorial', name: 'Bài tập', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'exam', name: 'Thi/KT', color: 'bg-red-100 text-red-800' },
];

export default function ScheduleModal({ isOpen, onClose, subjects, onUpdateSubject, studentData, currentSemesterIndex }: ScheduleModalProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null);
  const [weekSchedule, setWeekSchedule] = useState<ExtendedWeekSchedule>({});

  useEffect(() => {
    if (isOpen) {
      generateWeekSchedule();
    }
  }, [isOpen, subjects]);

  const generateWeekSchedule = () => {
    const schedule: ExtendedWeekSchedule = {};
    
    // Initialize all days
    for (let day = 0; day <= 6; day++) {
      schedule[day] = [];
    }
    
    // Add all class schedules
    subjects.forEach(subject => {
      if (subject.schedule) {
        subject.schedule.forEach(classSchedule => {
          schedule[classSchedule.dayOfWeek].push({
            ...classSchedule,
            subjectName: subject.name,
            subjectColor: getSubjectColor(subject.id)
          });
        });
      }
    });
    
    // Sort by start time
    Object.keys(schedule).forEach(day => {
      schedule[parseInt(day)].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    
    setWeekSchedule(schedule);
  };

  const getSubjectColor = (subjectId: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800', 
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-teal-100 text-teal-800',
      'bg-red-100 text-red-800',
    ];
    const index = subjects.findIndex(s => s.id === subjectId);
    return colors[index % colors.length];
  };

  const handleAddSchedule = () => {
    if (!selectedSubject) {
      alert('Vui lòng chọn môn học!');
      return;
    }
    
    const newSchedule: ClassSchedule = {
      id: generateId(),
      subjectId: selectedSubject,
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '09:50',
      room: '',
      type: 'lecture'
    };
    
    setEditingSchedule(newSchedule);
  };

  const handleSaveSchedule = (schedule: ClassSchedule) => {
    const subject = subjects.find(s => s.id === schedule.subjectId);
    if (!subject) return;
    
    const existingSchedules = subject.schedule || [];
    let updatedSchedules;
    
    if (existingSchedules.find(s => s.id === schedule.id)) {
      // Update existing
      updatedSchedules = existingSchedules.map(s => s.id === schedule.id ? schedule : s);
    } else {
      // Add new
      updatedSchedules = [...existingSchedules, schedule];
    }
    
    onUpdateSubject(schedule.subjectId, updatedSchedules);
    setEditingSchedule(null);
    generateWeekSchedule();
  };

  const handleDeleteSchedule = (scheduleId: string, subjectId: string) => {
    if (confirm('Bạn có chắc muốn xóa lịch học này?')) {
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) return;
      
      const updatedSchedules = (subject.schedule || []).filter(s => s.id !== scheduleId);
      onUpdateSubject(subjectId, updatedSchedules);
      generateWeekSchedule();
    }
  };

  // Delete all schedules in current semester
  const handleDeleteAllSchedules = () => {
    const totalSchedules = subjects.reduce((total, subject) => 
      total + (subject.schedule?.length || 0), 0
    );
    
    if (totalSchedules === 0) {
      alert('Không có lịch học nào để xóa!');
      return;
    }

    const confirmMessage = `⚠️ Bạn có chắc muốn xóa TẤT CẢ lịch học?\n\n` +
      `Tổng số lịch sẽ bị xóa: ${totalSchedules} lịch\n` +
      `Từ ${subjects.filter(s => s.schedule && s.schedule.length > 0).length} môn học\n\n` +
      `Hành động này KHÔNG THỂ hoàn tác!`;

    if (confirm(confirmMessage)) {
      // Clear all schedules from all subjects
      subjects.forEach(subject => {
        if (subject.schedule && subject.schedule.length > 0) {
          onUpdateSubject(subject.id, []);
        }
      });
      
      generateWeekSchedule();
      alert(`✅ Đã xóa thành công ${totalSchedules} lịch học!`);
    }
  };

  // Delete all schedules for selected subject
  const handleDeleteSubjectSchedules = () => {
    if (!selectedSubject) {
      alert('Vui lòng chọn môn học trước!');
      return;
    }

    const subject = subjects.find(s => s.id === selectedSubject);
    if (!subject || !subject.schedule || subject.schedule.length === 0) {
      alert('Môn học này không có lịch học nào!');
      return;
    }

    const scheduleCount = subject.schedule.length;
    const confirmMessage = `⚠️ Bạn có chắc muốn xóa TẤT CẢ lịch học của môn "${subject.name}"?\n\n` +
      `Số lịch sẽ bị xóa: ${scheduleCount} lịch\n\n` +
      `Hành động này KHÔNG THỂ hoàn tác!`;

    if (confirm(confirmMessage)) {
      onUpdateSubject(selectedSubject, []);
      generateWeekSchedule();
      alert(`✅ Đã xóa thành công ${scheduleCount} lịch học của môn "${subject.name}"!`);
    }
  };

  // Delete all schedules for a specific subject (for list view)
  const handleDeleteAllSubjectSchedules = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject || !subject.schedule || subject.schedule.length === 0) {
      alert('Môn học này không có lịch học nào!');
      return;
    }

    const scheduleCount = subject.schedule.length;
    const confirmMessage = `⚠️ Bạn có chắc muốn xóa TẤT CẢ lịch học của môn "${subject.name}"?\n\n` +
      `Số lịch sẽ bị xóa: ${scheduleCount} lịch\n\n` +
      `Hành động này KHÔNG THỂ hoàn tác!`;

    if (confirm(confirmMessage)) {
      onUpdateSubject(subjectId, []);
      generateWeekSchedule();
      alert(`✅ Đã xóa thành công ${scheduleCount} lịch học của môn "${subject.name}"!`);
    }
  };

  const getClassTypeInfo = (type: string) => {
    return CLASS_TYPES.find(t => t.key === type) || CLASS_TYPES[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-7xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              📅 Thời khóa biểu
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex rounded-lg border">
                <button
                  onClick={() => setView('grid')}
                  className={`px-3 py-1 text-sm ${
                    view === 'grid' 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📊 Lưới
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-1 text-sm ${
                    view === 'list' 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📋 Danh sách
                </button>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Add Schedule Controls */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap items-center gap-4">
              {/* Export Controls */}
              {studentData && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportScheduleToExcel(studentData, currentSemesterIndex)}
                    className="btn-secondary flex items-center gap-2 text-sm"
                    disabled={!subjects.some(s => s.schedule && s.schedule.length > 0)}
                  >
                    📊 Xuất Excel học kỳ này
                  </button>
                  <button
                    onClick={() => exportScheduleToExcel(studentData)}
                    className="btn-secondary flex items-center gap-2 text-sm"
                    disabled={!studentData.semesters.some(sem => sem.subjects.some(s => s.schedule && s.schedule.length > 0))}
                  >
                    📋 Xuất Excel tất cả học kỳ
                  </button>
                </div>
              )}

              {/* Delete Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteAllSchedules}
                  className="btn-secondary flex items-center gap-2 text-sm text-red-600 hover:bg-red-50"
                  disabled={!subjects.some(s => s.schedule && s.schedule.length > 0)}
                  title="Xóa tất cả lịch học trong học kỳ này"
                >
                  🗑️ Xóa tất cả lịch
                </button>
                <button
                  onClick={handleDeleteSubjectSchedules}
                  className="btn-secondary flex items-center gap-2 text-sm text-red-600 hover:bg-red-50"
                  disabled={!selectedSubject || !subjects.find(s => s.id === selectedSubject)?.schedule?.length}
                  title="Xóa tất cả lịch của môn học đã chọn"
                >
                  🗑️ Xóa lịch môn này
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Chọn môn học:</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="input-field"
                >
                  <option value="">-- Chọn môn học --</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-6">
                <button
                  onClick={handleAddSchedule}
                  className="btn-primary flex items-center gap-2"
                >
                  ➕ Thêm lịch học
                </button>
              </div>
            </div>
          </div>

          {/* Schedule Overview */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700">
              📊 Tổng quan: {subjects.reduce((total, s) => total + (s.schedule?.length || 0), 0)} lịch học 
              từ {subjects.filter(s => s.schedule && s.schedule.length > 0).length} môn
              {subjects.reduce((total, s) => total + (s.schedule?.length || 0), 0) === 0 && 
                <span className="ml-2">- Chưa có lịch học nào</span>
              }
            </div>
          </div>

          {/* Schedule Content */}
          <div className="overflow-auto max-h-[60vh]">
            {view === 'grid' ? (
              <ScheduleGrid 
                weekSchedule={weekSchedule}
                timeSlots={TIME_SLOTS}
                days={DAYS}
                onEditSchedule={setEditingSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                getClassTypeInfo={getClassTypeInfo}
                subjects={subjects}
              />
            ) : (
              <ScheduleList 
                subjects={subjects}
                onEditSchedule={setEditingSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onDeleteAllSubjectSchedules={handleDeleteAllSubjectSchedules}
                getClassTypeInfo={getClassTypeInfo}
              />
            )}
          </div>

          {/* Schedule Edit Modal */}
          {editingSchedule && (
            <ScheduleEditForm
              schedule={editingSchedule}
              subjects={subjects}
              onSave={handleSaveSchedule}
              onCancel={() => setEditingSchedule(null)}
              onDelete={handleDeleteSchedule}
              onUpdateSubject={onUpdateSubject}
              timeSlots={TIME_SLOTS}
              days={DAYS}
              classTypes={CLASS_TYPES}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Grid View Component
interface ExtendedClassSchedule extends ClassSchedule {
  subjectName?: string;
  subjectColor?: string;
}

interface ExtendedWeekSchedule {
  [key: number]: ExtendedClassSchedule[];
}

interface ScheduleGridProps {
  weekSchedule: ExtendedWeekSchedule;
  timeSlots: any[];
  days: any[];
  onEditSchedule: (schedule: ClassSchedule) => void;
  onDeleteSchedule: (scheduleId: string, subjectId: string) => void;
  getClassTypeInfo: (type: string) => any;
  subjects: Subject[];
}

function ScheduleGrid({ weekSchedule, timeSlots, days, onEditSchedule, onDeleteSchedule, getClassTypeInfo, subjects }: ScheduleGridProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white rounded-lg border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-sm font-medium min-w-20">Tiết</th>
            {days.map(day => (
              <th key={day.key} className="border p-2 text-sm font-medium min-w-32">
                {day.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(slot => (
            <tr key={slot.period}>
              <td className="border p-2 text-center bg-gray-50">
                <div className="text-sm font-medium">Tiết {slot.period}</div>
                <div className="text-xs text-gray-600">
                  {slot.startTime}-{slot.endTime}
                </div>
              </td>
              {days.map(day => {
                const daySchedules = weekSchedule[day.key] || [];
                const classInSlot = daySchedules.find((cls: ExtendedClassSchedule) => 
                  cls.startTime <= slot.startTime && cls.endTime > slot.startTime
                );
                
                return (
                  <td key={day.key} className="border p-1 align-top h-20 relative">
                    {classInSlot && (
                      <div 
                        className={`p-2 rounded text-xs ${classInSlot.subjectColor} cursor-pointer hover:opacity-80`}
                        onClick={() => onEditSchedule(classInSlot)}
                      >
                        <div className="font-medium truncate">
                          {classInSlot.subjectName}
                        </div>
                        <div className="text-xs opacity-75">
                          {classInSlot.room}
                        </div>
                        <div className="text-xs opacity-75">
                          {getClassTypeInfo(classInSlot.type).name}
                        </div>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// List View Component  
interface ScheduleListProps {
  subjects: Subject[];
  onEditSchedule: (schedule: ClassSchedule) => void;
  onDeleteSchedule: (scheduleId: string, subjectId: string) => void;
  onDeleteAllSubjectSchedules: (subjectId: string) => void;
  getClassTypeInfo: (type: string) => any;
}

function ScheduleList({ subjects, onEditSchedule, onDeleteSchedule, onDeleteAllSubjectSchedules, getClassTypeInfo }: ScheduleListProps) {
  return (
    <div className="space-y-6">
      {subjects.map((subject: Subject) => (
        subject.schedule && subject.schedule.length > 0 && (
          <div key={subject.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                📚 {subject.name}
              </h3>
              <button
                onClick={() => onDeleteAllSubjectSchedules(subject.id)}
                className="btn-secondary text-sm text-red-600 hover:bg-red-50 flex items-center gap-1"
                title={`Xóa tất cả ${subject.schedule?.length || 0} lịch học của môn này`}
              >
                🗑️ Xóa tất cả ({subject.schedule?.length || 0})
              </button>
            </div>
            <div className="space-y-2">
              {subject.schedule.map(schedule => {
                const day = DAYS.find(d => d.key === schedule.dayOfWeek);
                const typeInfo = getClassTypeInfo(schedule.type);
                
                return (
                  <div 
                    key={schedule.id} 
                    className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{day?.name}</span>
                        <span>{schedule.startTime} - {schedule.endTime}</span>
                        <span className="text-gray-600">{schedule.room}</span>
                        <span className={`px-2 py-1 rounded text-xs ${typeInfo.color}`}>
                          {typeInfo.name}
                        </span>
                      </div>
                      {schedule.instructor && (
                        <div className="text-sm text-gray-600 mt-1">
                          GV: {schedule.instructor}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEditSchedule(schedule)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDeleteSchedule(schedule.id, subject.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ))}
    </div>
  );
}

// Edit Form Component
interface ScheduleEditFormProps {
  schedule: ClassSchedule;
  subjects: Subject[];
  onSave: (schedule: ClassSchedule) => void;
  onCancel: () => void;
  onDelete?: (scheduleId: string, subjectId: string) => void;
  onUpdateSubject: (subjectId: string, schedule: ClassSchedule[]) => void;
  timeSlots: any[];
  days: any[];
  classTypes: any[];
}

function ScheduleEditForm({ schedule, subjects, onSave, onCancel, onDelete, onUpdateSubject, timeSlots, days, classTypes }: ScheduleEditFormProps) {
  const [formData, setFormData] = useState({ ...schedule });
  const [conflicts, setConflicts] = useState<string[]>([]);

  // Check for schedule conflicts and return conflicting schedules info
  const checkScheduleConflicts = (checkData: ClassSchedule): { 
    conflicts: string[], 
    conflictingSchedules: { subjectId: string, scheduleId: string, schedule: ClassSchedule }[] 
  } => {
    const conflicts: string[] = [];
    const conflictingSchedules: { subjectId: string, scheduleId: string, schedule: ClassSchedule }[] = [];
    
    // Get all existing schedules from all subjects
    subjects.forEach(subject => {
      if (subject.schedule) {
        subject.schedule.forEach(existingSchedule => {
          // Skip if checking against the same schedule (when editing)
          if (existingSchedule.id === checkData.id) {
            return;
          }

          // Skip if different day
          if (existingSchedule.dayOfWeek !== checkData.dayOfWeek) {
            return;
          }

          // Convert time strings to minutes for easier comparison
          const getMinutes = (timeStr: string) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
          };

          const existingStart = getMinutes(existingSchedule.startTime);
          const existingEnd = getMinutes(existingSchedule.endTime);
          const newStart = getMinutes(checkData.startTime);
          const newEnd = getMinutes(checkData.endTime);

          // Check for time overlap
          if (newStart < existingEnd && newEnd > existingStart) {
            const dayName = days.find((d: any) => d.key === existingSchedule.dayOfWeek)?.name || 'Không xác định';
            const subjectName = subject.name;
            
            conflicts.push(
              `Trùng với môn "${subjectName}" vào ${dayName}, ${existingSchedule.startTime} - ${existingSchedule.endTime}`
            );
            
            conflictingSchedules.push({
              subjectId: subject.id,
              scheduleId: existingSchedule.id,
              schedule: existingSchedule
            });
          }
        });
      }
    });

    return { conflicts, conflictingSchedules };
  };

  // Check conflicts whenever form data changes
  useEffect(() => {
    const { conflicts: newConflicts } = checkScheduleConflicts(formData);
    setConflicts(newConflicts);
  }, [formData.dayOfWeek, formData.startTime, formData.endTime, formData.subjectId]);

  const handleSave = () => {
    if (!formData.room.trim()) {
      alert('Vui lòng nhập phòng học!');
      return;
    }

    // Check for conflicts one more time before saving
    const { conflicts: currentConflicts, conflictingSchedules } = checkScheduleConflicts(formData);
    if (currentConflicts.length > 0) {
      const conflictMessage = `⚠️ Phát hiện xung đột lịch học:\n\n${currentConflicts.join('\n')}`;
      
      // First ask if user wants to proceed
      if (!confirm(`${conflictMessage}\n\nBạn có muốn tiếp tục không?`)) {
        return; // User cancelled
      }
      
      // Ask what to do with conflicts
      const replaceChoice = confirm(
        `🔄 Chọn cách xử lý xung đột:\n\n` +
        `• OK: Thay thế lịch cũ bằng lịch mới\n` +
        `• Cancel: Giữ cả hai lịch (sẽ có lịch trùng)`
      );
      
      if (replaceChoice) {
        // User chose to replace - remove conflicting schedules first
        conflictingSchedules.forEach(({ subjectId, scheduleId }) => {
          const subject = subjects.find(s => s.id === subjectId);
          if (subject && subject.schedule) {
            const updatedSchedules = subject.schedule.filter(s => s.id !== scheduleId);
            onUpdateSubject(subjectId, updatedSchedules);
          }
        });
        
        // Small delay to ensure state updates are processed
        setTimeout(() => {
          onSave(formData);
        }, 100);
        return;
      }
      // If user chose to keep both, just proceed with normal save
    }

    onSave(formData);
  };

  const handleDelete = () => {
    if (!onDelete || !schedule.id) return;
    
    const subject = subjects.find(s => s.id === formData.subjectId);
    const dayName = days.find((d: any) => d.key === formData.dayOfWeek)?.name || 'Không xác định';
    const classType = classTypes.find((t: any) => t.key === formData.type)?.name || formData.type;
    
    if (!subject) return;
    
    const confirmMessage = `⚠️ Bạn có chắc muốn xóa lịch học này?\n\n` +
      `📚 Môn: ${subject.name}\n` +
      `📅 Thứ: ${dayName}\n` +
      `⏰ Thời gian: ${formData.startTime} - ${formData.endTime}\n` +
      `🏠 Phòng: ${formData.room || 'Chưa có'}\n` +
      `📖 Loại: ${classType}\n` +
      (formData.instructor ? `👨‍🏫 GV: ${formData.instructor}\n` : '') +
      `\n🚫 Hành động này không thể hoàn tác!`;
    
    if (confirm(confirmMessage)) {
      onDelete(schedule.id, formData.subjectId);
      onCancel(); // Close the modal after deleting
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {schedule.id ? 'Chỉnh sửa lịch học' : 'Thêm lịch học'}
          </h3>
          {schedule.id && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              📝 Đang chỉnh sửa
            </span>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Môn học:</label>
            <select
              value={formData.subjectId}
              onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
              className="input-field w-full"
            >
              {subjects.map((subject: Subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Thứ:</label>
            <select
              value={formData.dayOfWeek}
              onChange={(e) => setFormData({...formData, dayOfWeek: parseInt(e.target.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6})}
              className="input-field w-full"
            >
              {days.map((day: any) => (
                <option key={day.key} value={day.key}>
                  {day.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Giờ bắt đầu:</label>
              <select
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className="input-field w-full"
              >
                {timeSlots.map((slot: any) => (
                  <option key={slot.startTime} value={slot.startTime}>
                    {slot.startTime}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Giờ kết thúc:</label>
              <select
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className="input-field w-full"
              >
                {timeSlots.map((slot: any) => (
                  <option key={slot.endTime} value={slot.endTime}>
                    {slot.endTime}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phòng học:</label>
            <input
              type="text"
              value={formData.room}
              onChange={(e) => setFormData({...formData, room: e.target.value})}
              className="input-field w-full"
              placeholder="VD: A101, B205"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Loại tiết:</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as 'lecture' | 'lab' | 'tutorial' | 'exam'})}
              className="input-field w-full"
            >
              {classTypes.map((type: any) => (
                <option key={type.key} value={type.key}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Giảng viên:</label>
            <input
              type="text"
              value={formData.instructor || ''}
              onChange={(e) => setFormData({...formData, instructor: e.target.value})}
              className="input-field w-full"
              placeholder="VD: TS. Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú:</label>
            <input
              type="text"
              value={formData.note || ''}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
              className="input-field w-full"
              placeholder="Ghi chú thêm"
            />
          </div>

          {/* Conflict Warning */}
          {conflicts.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-600">⚠️</span>
                <span className="font-medium text-red-700">Phát hiện xung đột lịch học!</span>
              </div>
              <div className="space-y-1">
                {conflicts.map((conflict, index) => (
                  <div key={index} className="text-sm text-red-600">
                    • {conflict}
                  </div>
                ))}
              </div>
              <div className="text-xs text-red-500 mt-2">
                Khi lưu, bạn sẽ được chọn: thay thế lịch cũ hoặc giữ cả hai.
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-6">
          {/* Delete button - only show when editing existing schedule */}
          <div>
            {schedule.id && (
              <button 
                onClick={handleDelete}
                className="btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                🗑️ Xóa lịch này
              </button>
            )}
          </div>
          
          {/* Save/Cancel buttons */}
          <div className="flex gap-3">
            <button onClick={onCancel} className="btn-secondary">
              Hủy
            </button>
            <button 
              onClick={handleSave} 
              className={`btn-primary ${conflicts.length > 0 ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
            >
              {conflicts.length > 0 ? '⚠️ Lưu với tùy chọn xử lý' : 'Lưu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 