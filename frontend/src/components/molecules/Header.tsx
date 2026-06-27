'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { HelpCircle, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[38px] h-[38px]" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

export default function Header() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <header className="w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 py-4 px-6 flex justify-between items-center sticky top-0 z-10 transition-colors">
      <div className="flex items-center space-x-2">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">Y</div>
          <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">요금제 비교</span>
        </Link>
      </div>
      <div className="flex items-center space-x-3 relative">
        <ThemeToggle />
        <button 
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center text-gray-600 dark:text-gray-300 text-sm font-medium border border-gray-200 dark:border-slate-700 rounded-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900"
        >
          <HelpCircle size={16} className="mr-1.5" /> 이용 방법
        </button>

        {showHelp && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowHelp(false)}></div>
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 p-6 animate-in fade-in slide-in-from-top-2 duration-200">
              <h3 className="text-base font-bold text-gray-900 mb-4">💡 YOGI 이용 방법</h3>
              <ol className="space-y-4 text-sm text-gray-600">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mt-0.5 mr-3">1</div>
                  <p><strong className="text-gray-800">내 통신 정보 입력</strong><br/>현재 사용 중인 통신사와 요금, 데이터 사용량을 폼에 입력해 주세요.</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mt-0.5 mr-3">2</div>
                  <p><strong className="text-gray-800">AI 맞춤 분석</strong><br/>AI가 수백 개의 요금제를 스캔하여 가장 혜택이 크고 저렴한 요금제를 선별합니다.</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mt-0.5 mr-3">3</div>
                  <p><strong className="text-gray-800">비교 및 가입</strong><br/>기존 요금제 대비 혜택과 절약 금액을 차트로 비교한 뒤, [자세히 보기]를 눌러 이동하세요.</p>
                </li>
              </ol>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
