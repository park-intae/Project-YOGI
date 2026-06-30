'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { yogiApi } from '@/lib/api';
import { Loader2, Sparkles } from 'lucide-react';
import OptionCard from './OptionCard';

export default function DiagnosticForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'current' | 'custom'>('current');
  const [isDataUnlimited, setIsDataUnlimited] = useState(true);
  const [isVoiceUnlimited, setIsVoiceUnlimited] = useState(true);
  const [isSmsUnlimited, setIsSmsUnlimited] = useState(true);

  const defaultCarrier = searchParams.get('carrier_type') || 'SKT';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const carrier = formData.get('carrier') as string;
    const planName = formData.get('planName') as string;
    const baseFee = formData.get('baseFee') as string;
    const dataAllowanceGb = formData.get('dataAllowanceGb') as string;
    const voiceAllowanceMin = formData.get('voiceAllowanceMin') as string;

    try {
      const response = await yogiApi.createSession({
        input_type: 'PLAN',
        current_plan: {
          actual_carrier: carrier,
          actual_plan_name: planName,
          actual_monthly_fee: Number(baseFee.replace(/[^0-9]/g, '')) || 0,
          actual_data_usage: isDataUnlimited ? 9999 : (Number(dataAllowanceGb) || 0),
          actual_voice_usage: isVoiceUnlimited ? 9999 : (Number(voiceAllowanceMin) || 0),
        }
      });
      router.push(`/?input_id=${response.id}`, { scroll: false });
    } catch (error: any) {
      console.error('Failed to create session:', error);
      setError(error.response?.data?.message || '서버 통신에 실패했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  return (
    <div id="step-form" className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Header Area in Design */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">통신 3사 요금 내지 마세요, 알뜰폰으로 반값 할인받기</h1>
          <p className="text-gray-600 dark:text-gray-400">현재 사용 중인 비싼 통신사 요금을 입력하면, 혜택은 그대로면서 가격만 저렴한 알뜰폰 요금제를 찾아드립니다.</p>
        </div>
      </div>

      {/* Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <OptionCard mode="current" selectedMode={inputMode} onClick={() => setInputMode('current')} />
        <OptionCard mode="custom" selectedMode={inputMode} onClick={() => setInputMode('custom')} />
      </div>

      {/* Input Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 md:p-8 shadow-sm mb-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-2">통신사 선택</label>
              <select name="carrier" defaultValue={defaultCarrier} className="w-full p-2 border border-transparent rounded-lg bg-transparent hover:bg-gray-50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-900 dark:text-white font-bold transition-all cursor-pointer appearance-none">
                <option value="SKT">SKT</option>
                <option value="KT">KT</option>
                <option value="LGU+">LG U+</option>
                <option value="알뜰폰">알뜰폰</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-2">현재 요금제</label>
              <input name="planName" type="text" defaultValue="5GX 프라임" className="w-full p-2 border border-transparent rounded-lg bg-transparent hover:bg-gray-50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-900 dark:text-white font-bold transition-all" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-2">월 요금 (원)</label>
              <input name="baseFee" type="text" defaultValue="89,000" className="w-full p-2 border border-transparent rounded-lg bg-transparent hover:bg-gray-50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-900 dark:text-white font-bold transition-all" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-3 ml-2 mb-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">데이터 (GB)</label>
                <label className={`flex items-center px-1.5 py-[1px] rounded-full cursor-pointer transition-all border ${isDataUnlimited ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400 dark:hover:bg-slate-700'}`}>
                  <input type="checkbox" checked={isDataUnlimited} onChange={(e) => setIsDataUnlimited(e.target.checked)} className="sr-only" />
                  <span className="text-[10px] leading-none font-bold tracking-wide mt-[1px]">무제한</span>
                </label>
              </div>
              <input name="dataAllowanceGb" type="number" min="0" disabled={isDataUnlimited} placeholder="예: 100" className="w-full p-2 border border-transparent rounded-lg bg-transparent hover:bg-gray-50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-900 dark:text-white font-bold transition-all disabled:opacity-50" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-3 ml-2 mb-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">통화 (분)</label>
                <label className={`flex items-center px-1.5 py-[1px] rounded-full cursor-pointer transition-all border ${isVoiceUnlimited ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400 dark:hover:bg-slate-700'}`}>
                  <input type="checkbox" checked={isVoiceUnlimited} onChange={(e) => setIsVoiceUnlimited(e.target.checked)} className="sr-only" />
                  <span className="text-[10px] leading-none font-bold tracking-wide mt-[1px]">무제한</span>
                </label>
              </div>
              <input name="voiceAllowanceMin" type="number" min="0" disabled={isVoiceUnlimited} placeholder="예: 300" className="w-full p-2 border border-transparent rounded-lg bg-transparent hover:bg-gray-50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-900 dark:text-white font-bold transition-all disabled:opacity-50" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-3 ml-2 mb-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">문자 (건)</label>
                <label className={`flex items-center px-1.5 py-[1px] rounded-full cursor-pointer transition-all border ${isSmsUnlimited ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400 dark:hover:bg-slate-700'}`}>
                  <input type="checkbox" checked={isSmsUnlimited} onChange={(e) => setIsSmsUnlimited(e.target.checked)} className="sr-only" />
                  <span className="text-[10px] leading-none font-bold tracking-wide mt-[1px]">기본제공</span>
                </label>
              </div>
              <input name="smsAllowance" type="number" min="0" disabled={isSmsUnlimited} placeholder="예: 300" className="w-full p-2 border border-transparent rounded-lg bg-transparent hover:bg-gray-50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-900 dark:text-white font-bold transition-all disabled:opacity-50" />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 flex items-center justify-center">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#2A41FF] hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-xl transition-colors flex items-center shadow-md disabled:bg-blue-400 text-lg w-full md:w-auto justify-center"
            >
              {isLoading ? (
                <><Loader2 className="animate-spin mr-2" size={24} /> AI 분석 진행 중...</>
              ) : (
                <><Sparkles className="mr-2" size={20} /> AI 추천 요금제 확인하기</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
