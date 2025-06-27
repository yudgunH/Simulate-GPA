'use client';

import { useState, useEffect } from 'react';
import { StudentRecord } from '@/types';
import { restoreFromBackup } from '@/utils/storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (backupData: StudentRecord) => void;
}

interface BackupItem extends StudentRecord {
  _backupDate?: string;
  _backupKey?: string;
}

export default function BackupModal({ isOpen, onClose, onRestore }: BackupModalProps) {
  const [backups, setBackups] = useState<BackupItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      const backupList = restoreFromBackup();
      setBackups(backupList);
    }
  }, [isOpen]);

  const handleRestore = (backup: BackupItem) => {
    if (confirm(`Bạn có chắc muốn khôi phục backup từ ${backup._backupDate}?\nDữ liệu hiện tại sẽ bị thay thế!`)) {
      // Tạo bản sao không có metadata backup
      const cleanBackup = { ...backup };
      delete cleanBackup._backupDate;
      delete cleanBackup._backupKey;
      
      onRestore(cleanBackup);
      onClose();
    }
  };

  const handleDeleteBackup = (backupKey: string) => {
    if (confirm('Bạn có chắc muốn xóa backup này?')) {
      localStorage.removeItem(backupKey);
      // Refresh danh sách backup
      const updatedBackups = restoreFromBackup();
      setBackups(updatedBackups);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              🔄 Quản lý Backup
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          {backups.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">📦 Không có backup nào</div>
              <p className="text-gray-400">
                Backup sẽ được tạo tự động khi bạn thay đổi dữ liệu.<br/>
                Hệ thống giữ tối đa 5 backup gần nhất.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Tìm thấy {backups.length} backup. Nhấp để khôi phục hoặc xóa.
              </div>
              
              <div className="overflow-y-auto max-h-96">
                <div className="space-y-3">
                  {backups.map((backup, index) => (
                    <div 
                      key={backup._backupKey || index}
                      className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">💾</span>
                            <span className="font-medium text-gray-900">
                              Backup #{backups.length - index}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {formatDate(backup._backupDate || '')}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Sinh viên:</span><br/>
                              {backup.studentName}
                            </div>
                            <div>
                              <span className="font-medium">Số học kỳ:</span><br/>
                              {backup.semesters?.length || 0}
                            </div>
                            <div>
                              <span className="font-medium">Tổng môn:</span><br/>
                              {backup.semesters?.reduce((total, sem) => total + sem.subjects.length, 0) || 0}
                            </div>
                            <div>
                              <span className="font-medium">GPA tích lũy:</span><br/>
                              {backup.cumulativeGPA?.toFixed(2) || 'N/A'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleRestore(backup)}
                            className="btn-primary text-sm flex items-center gap-1"
                          >
                            🔄 Khôi phục
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(backup._backupKey || '')}
                            className="btn-secondary text-sm flex items-center gap-1 text-red-600 hover:bg-red-50"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-6 border-t mt-6">
            <div className="text-sm text-gray-500">
              💡 Backup được tạo tự động mỗi 30 giây khi có thay đổi
            </div>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 