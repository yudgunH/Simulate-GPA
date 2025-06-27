'use client';

import { useState } from 'react';
import { Subject } from '@/types';
import { simulateGradeChange, calculateRequiredGPA, convertGPAToGrade } from '@/utils/gpa';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  currentGPA: number;
}

export default function SimulationModal({ isOpen, onClose, subjects, currentGPA }: SimulationModalProps) {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [simulatedGrade, setSimulatedGrade] = useState(8.0);
  const [targetGPA, setTargetGPA] = useState(3.5);
  const [newSemesterCredits, setNewSemesterCredits] = useState(15);

  if (!isOpen) return null;

  const selectedSub = subjects.find(s => s.id === selectedSubject);
  const simulation = selectedSub ? simulateGradeChange(subjects, selectedSubject, simulatedGrade) : null;
  
  const requiredGPA = calculateRequiredGPA([], targetGPA, newSemesterCredits);
  const requiredGrade = convertGPAToGrade(requiredGPA);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🎯 Mô phỏng kết quả</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Simulation 1: Change grade of existing subject */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">📈 Thay đổi điểm môn học</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn môn học:
                  </label>
                  <select 
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="input-field"
                  >
                    <option value="">-- Chọn môn --</option>
                    {subjects.filter(s => s.grade !== null).map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} (hiện tại: {subject.grade})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Điểm mô phỏng:
                  </label>
                  <input
                    type="number"
                    value={simulatedGrade}
                    onChange={(e) => setSimulatedGrade(Number(e.target.value))}
                    className="input-field"
                    min="0"
                    max="10"
                    step="0.1"
                  />
                </div>

                {simulation && selectedSub && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Kết quả mô phỏng:</h4>
                    <div className="space-y-1 text-sm text-blue-800">
                      <div>Từ {selectedSub.grade} → {simulatedGrade} điểm</div>
                      <div>GPA học kỳ: {simulation.newGPA.toFixed(2)}</div>
                      <div className={`font-medium ${simulation.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {simulation.change >= 0 ? '📈' : '📉'} 
                        {simulation.change >= 0 ? '+' : ''}{simulation.change.toFixed(3)} điểm GPA
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Simulation 2: Required GPA for target */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">🎯 Điểm cần thiết để đạt mục tiêu</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GPA mục tiêu:
                    </label>
                    <input
                      type="number"
                      value={targetGPA}
                      onChange={(e) => setTargetGPA(Number(e.target.value))}
                      className="input-field"
                      min="0"
                      max="4"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số tín chỉ kỳ mới:
                    </label>
                    <input
                      type="number"
                      value={newSemesterCredits}
                      onChange={(e) => setNewSemesterCredits(Number(e.target.value))}
                      className="input-field"
                      min="1"
                      max="30"
                    />
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Yêu cầu:</h4>
                  <div className="space-y-1 text-sm text-green-800">
                    <div>GPA hiện tại: {currentGPA.toFixed(2)}</div>
                    <div>Để đạt GPA {targetGPA}, bạn cần:</div>
                    <div className="font-medium">
                      🎯 GPA kỳ mới: {requiredGPA.toFixed(2)} 
                      (≈ {requiredGrade.toFixed(1)} điểm thang 10)
                    </div>
                    {requiredGPA > 4.0 && (
                      <div className="text-red-600 font-medium">
                        ⚠️ Không thể đạt được! Hãy điều chỉnh mục tiêu.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick scenarios */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">⚡ Tình huống nhanh</h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="font-medium text-red-900 mb-1">😰 Nếu rớt 1 môn 3 tín chỉ:</div>
                  <div className="text-red-700">
                    GPA giảm ≈ {(3 * currentGPA / (subjects.reduce((acc, s) => acc + s.credits, 0) + 3)).toFixed(3)} điểm
                  </div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-900 mb-1">🌟 Nếu đạt 9.0 tất cả môn:</div>
                  <div className="text-green-700">
                    GPA có thể đạt: {((currentGPA * subjects.reduce((acc, s) => acc + s.credits, 0) + 3.7 * subjects.reduce((acc, s) => acc + s.credits, 0)) / (subjects.reduce((acc, s) => acc + s.credits, 0) * 2)).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              onClick={onClose}
              className="btn-primary"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 