'use client';

import { useState, useEffect } from 'react';
import { GPASettings, GPAScale } from '@/types';
import { DEFAULT_GPA_SETTINGS, PRESET_GPA_SETTINGS } from '@/utils/gpa';

interface GPASettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: GPASettings;
  onSave: (settings: GPASettings) => void;
}

export default function GPASettingsModal({ 
  isOpen, 
  onClose, 
  currentSettings, 
  onSave 
}: GPASettingsModalProps) {
  const [settings, setSettings] = useState<GPASettings>(currentSettings);
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  useEffect(() => {
    setSettings(currentSettings);
    
    // Tìm preset phù hợp với settings hiện tại
    const matchingPreset = Object.entries(PRESET_GPA_SETTINGS).find(([key, preset]) => 
      JSON.stringify(preset) === JSON.stringify(currentSettings)
    );
    
    setSelectedPreset(matchingPreset ? matchingPreset[0] : 'custom');
  }, [currentSettings, isOpen]);

  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (presetKey !== 'custom' && PRESET_GPA_SETTINGS[presetKey]) {
      setSettings(PRESET_GPA_SETTINGS[presetKey]);
    }
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleReset = () => {
    setSettings(DEFAULT_GPA_SETTINGS);
    setSelectedPreset('vn-4.0');
  };

  const updateScale = (grade: keyof GPAScale, value: number) => {
    setSettings(prev => ({
      ...prev,
      scale: {
        ...prev.scale,
        [grade]: value
      }
    }));
    setSelectedPreset('custom');
  };

  const updateGradeRange = (grade: keyof GPASettings['gradeRanges'], field: 'min' | 'max', value: number) => {
    setSettings(prev => ({
      ...prev,
      gradeRanges: {
        ...prev.gradeRanges,
        [grade]: {
          ...prev.gradeRanges[grade],
          [field]: value
        }
      }
    }));
    setSelectedPreset('custom');
  };

  const updateMaxGPA = (value: number) => {
    setSettings(prev => ({
      ...prev,
      maxGPA: value
    }));
    setSelectedPreset('custom');
  };

  if (!isOpen) return null;

  const gradeLabels = {
    A_PLUS: 'A+',
    A: 'A',
    B_PLUS: 'B+',
    B: 'B',
    C_PLUS: 'C+',
    C: 'C',
    D_PLUS: 'D+',
    D: 'D',
    F: 'F'
  };

  const presetLabels = {
    'vn-4.0': 'Việt Nam (4.0)',
    'us-4.0': 'Mỹ (4.0)',
    'us-4.3': 'Mỹ (4.3)',
    'simple-4.0': 'Đơn giản (A, B, C, D)',
    'simple-5.0': 'Đơn giản (5.0)'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              ⚙️ Cấu hình thang đo GPA
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Preset Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📋 Thang đo có sẵn
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(presetLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handlePresetChange(key)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPreset === key
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-gray-50 hover:border-primary-200'
                  }`}
                >
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Max: {PRESET_GPA_SETTINGS[key].maxGPA}
                  </div>
                </button>
              ))}
                             <button
                 onClick={() => setSelectedPreset('custom')}
                 className={`p-4 rounded-lg border-2 transition-all ${
                   selectedPreset === 'custom'
                     ? 'border-primary-500 bg-primary-50 text-primary-700'
                     : 'border-gray-200 bg-gray-50 hover:border-primary-200'
                 }`}
               >
                <div className="font-medium">🛠️ Tùy chỉnh</div>
                <div className="text-sm text-gray-600 mt-1">
                  Tự thiết lập
                </div>
              </button>
            </div>
          </div>

          {/* Max GPA Setting */}
          <div className="mb-6">
            <label className="block text-lg font-semibold mb-2">
              🏆 Thang điểm tối đa
            </label>
            <input
              type="number"
              value={settings.maxGPA}
              onChange={(e) => updateMaxGPA(Number(e.target.value))}
              step="0.1"
              min="1"
              max="10"
              className="input-field w-32"
            />
            <p className="text-sm text-gray-600 mt-1">
              Thông thường: 4.0, 4.3, hoặc 5.0
            </p>
          </div>

          {/* Grade Scale Configuration */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📊 Cấu hình điểm GPA theo từng loại
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-gray-50 rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 border-b font-medium">Loại điểm</th>
                    <th className="text-left p-3 border-b font-medium">Điểm GPA</th>
                    <th className="text-left p-3 border-b font-medium">Khoảng điểm (thang 10)</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(gradeLabels) as Array<keyof GPAScale>).map((grade) => (
                    <tr key={grade} className="hover:bg-gray-50">
                      <td className="p-3 border-b font-medium">
                        {gradeLabels[grade]}
                      </td>
                      <td className="p-3 border-b">
                        <input
                          type="number"
                          value={settings.scale[grade]}
                          onChange={(e) => updateScale(grade, Number(e.target.value))}
                          step="0.1"
                          min="0"
                          max={settings.maxGPA}
                          className="input-field w-20"
                        />
                      </td>
                      <td className="p-3 border-b">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={settings.gradeRanges[grade].min}
                            onChange={(e) => updateGradeRange(grade, 'min', Number(e.target.value))}
                            step="0.1"
                            min="0"
                            max="10"
                            className="input-field w-16"
                          />
                          <span>-</span>
                          <input
                            type="number"
                            value={settings.gradeRanges[grade].max}
                            onChange={(e) => updateGradeRange(grade, 'max', Number(e.target.value))}
                            step="0.1"
                            min="0"
                            max="10"
                            className="input-field w-16"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Example Preview */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">🎯 Ví dụ:</h4>
            <div className="text-sm text-blue-800">
              Với điểm 8.5 trên thang 10 sẽ được chuyển đổi thành{' '}
              <span className="font-bold">
                {Object.entries(settings.gradeRanges)
                  .find(([_, range]) => 8.5 >= range.min && 8.5 <= range.max)
                  ?.[0] ? 
                  settings.scale[Object.entries(settings.gradeRanges)
                    .find(([_, range]) => 8.5 >= range.min && 8.5 <= range.max)![0] as keyof GPAScale] 
                  : 'N/A'} GPA
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <button
              onClick={handleReset}
              className="btn-secondary flex items-center gap-2"
            >
              🔄 Đặt lại mặc định
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="btn-primary"
              >
                💾 Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 