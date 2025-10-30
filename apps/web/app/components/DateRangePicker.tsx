'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const PRESET_RANGES = [
  { key: 'today', label: '오늘', days: 0 },
  { key: 'yesterday', label: '어제', days: 1 },
  { key: 'last_7_days', label: '최근 7일', days: 7 },
  { key: 'last_30_days', label: '최근 30일', days: 30 },
  { key: 'last_90_days', label: '최근 90일', days: 90 },
];

export default function DateRangePicker({ value, onChange, className = "" }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeInput, setActiveInput] = useState<'start' | 'end' | null>(null);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveInput(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('ko-KR');
  };

  const getDisplayText = () => {
    if (value.startDate && value.endDate) {
      // 프리셋 범위인지 확인
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      for (const preset of PRESET_RANGES) {
        let compareStartDate = new Date(today);
        let compareEndDate = new Date(today);

        if (preset.days === 0) {
          // 오늘
          compareStartDate = today;
          compareEndDate = today;
        } else if (preset.days === 1) {
          // 어제
          compareStartDate = yesterday;
          compareEndDate = yesterday;
        } else {
          // 최근 N일
          compareStartDate = new Date(today);
          compareStartDate.setDate(compareStartDate.getDate() - preset.days + 1);
          compareEndDate = today;
        }

        if (
          value.startDate.toDateString() === compareStartDate.toDateString() &&
          value.endDate.toDateString() === compareEndDate.toDateString()
        ) {
          return preset.label;
        }
      }

      // 커스텀 범위
      return `${formatDate(value.startDate)} ~ ${formatDate(value.endDate)}`;
    }
    return '기간을 선택하세요';
  };

  const handlePresetClick = (preset: typeof PRESET_RANGES[0]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let startDate: Date;
    let endDate: Date;

    if (preset.days === 0) {
      // 오늘
      startDate = new Date(today);
      endDate = new Date(today);
    } else if (preset.days === 1) {
      // 어제
      startDate = new Date(yesterday);
      endDate = new Date(yesterday);
    } else {
      // 최근 N일
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - preset.days + 1);
      endDate = new Date(today);
    }

    onChange({ startDate, endDate });
    setIsOpen(false);
  };

  const handleCustomDateChange = () => {
    if (tempStartDate && tempEndDate) {
      const startDate = new Date(tempStartDate);
      const endDate = new Date(tempEndDate);

      if (startDate <= endDate) {
        onChange({ startDate, endDate });
        setIsOpen(false);
        setActiveInput(null);
      }
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ startDate: null, endDate: null });
    setTempStartDate('');
    setTempEndDate('');
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative w-full px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-lg shadow-sm
          text-sm font-medium text-left cursor-pointer transition-all duration-200
          hover:bg-gray-50 hover:border-gray-300
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          ${value.startDate && value.endDate ? 'text-gray-900' : 'text-gray-500'}
        `}
      >
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
          <span className="block truncate">{getDisplayText()}</span>
        </div>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {value.startDate && value.endDate && (
            <div
              onClick={clearSelection}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-3 h-3 text-gray-400" />
            </div>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-4 space-y-4">
            {/* 프리셋 범위 */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">빠른 선택</h4>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_RANGES.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => handlePresetClick(preset)}
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 구분선 */}
            <div className="border-t border-gray-200"></div>

            {/* 커스텀 날짜 범위 */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">사용자 지정</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">시작일</label>
                    <input
                      type="date"
                      value={tempStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">종료일</label>
                    <input
                      type="date"
                      value={tempEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                      min={tempStartDate}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCustomDateChange}
                  disabled={!tempStartDate || !tempEndDate}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  적용
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}