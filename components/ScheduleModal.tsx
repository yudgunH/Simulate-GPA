'use client';

import { useState, useEffect } from 'react';
import { Subject, ClassSchedule, WeekSchedule } from '@/types';
import { generateId } from '@/utils/storage';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onUpdateSubject: (subjectId: string, schedule: ClassSchedule[]) => void;
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

export default function ScheduleModal({ isOpen, onClose, subjects, onUpdateSubject }: ScheduleModalProps) {
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
  getClassTypeInfo: (type: string) => any;
}

function ScheduleList({ subjects, onEditSchedule, onDeleteSchedule, getClassTypeInfo }: ScheduleListProps) {
  return (
    <div className="space-y-6">
      {subjects.map((subject: Subject) => (
        subject.schedule && subject.schedule.length > 0 && (
          <div key={subject.id} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              📚 {subject.name}
            </h3>
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
  timeSlots: any[];
  days: any[];
  classTypes: any[];
}

function ScheduleEditForm({ schedule, subjects, onSave, onCancel, timeSlots, days, classTypes }: ScheduleEditFormProps) {
  const [formData, setFormData] = useState({ ...schedule });

  const handleSave = () => {
    if (!formData.room.trim()) {
      alert('Vui lòng nhập phòng học!');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">
          {schedule.id ? 'Chỉnh sửa lịch học' : 'Thêm lịch học'}
        </h3>
        
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
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="btn-secondary">
            Hủy
          </button>
          <button onClick={handleSave} className="btn-primary">
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
} 