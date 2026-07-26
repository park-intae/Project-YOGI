import { FileText, SlidersHorizontal } from 'lucide-react';
import React from 'react';

interface OptionCardProps {
  mode: 'current' | 'custom';
  selectedMode: 'current' | 'custom';
  onClick: () => void;
}

export default function OptionCard({ mode, selectedMode, onClick }: OptionCardProps) {
  const isSelected = mode === selectedMode;

  const content = {
    current: {
      title: '현재 사용 정보 입력',
      description: '현재 사용 중인 요금제 정보를 입력하면\nAI가 더 잘 추천해드려요.',
      icon: <FileText size={32} />
    },
    custom: {
      title: '원하는 옵션 선택',
      description: '원하는 데이터, 통화, 문자 사용량을\n선택하면 추천해드려요.',
      icon: <SlidersHorizontal size={32} />
    }
  }[mode];

  return (
    <button 
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all ${isSelected ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/20' : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-200 dark:hover:border-slate-700'}`}
    >
      <div className="flex items-start">
        <div className="mt-1 mr-4">
          <div className={`w-5 h-5 rounded-full border-[5px] ${isSelected ? 'border-blue-600' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900'}`}></div>
        </div>
        <div className="text-left">
          <h3 className={`text-lg font-bold mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-700 dark:text-gray-200'}`}>{content.title}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm whitespace-pre-line">{content.description}</p>
        </div>
      </div>
      <div className="hidden sm:block">
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-500 dark:text-blue-400' : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500'}`}>
          {content.icon}
        </div>
      </div>
    </button>
  );
}
