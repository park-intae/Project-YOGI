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
        userPlan: {
          carrier: carrier,
          planName: planName,
          networkType: '5G', // default or derived
          baseFee: Number(baseFee.replace(/[^0-9]/g, '')) || 0,
          dataAllowanceGb: dataAllowanceGb === '무제한' ? 9999 : Number(dataAllowanceGb),
          voiceAllowanceMin: voiceAllowanceMin === '무제한' ? 9999 : Number(voiceAllowanceMin),
        }
      });
      router.push(`/result?input_id=${response.id}`);
    } catch (error: any) {
      console.error('Failed to create session:', error);
      setError(error.response?.data?.message || '서버 통신에 실패했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Header Area in Design */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">나에게 딱 맞는 요금제를 찾아보세요</h1>
          <p className="text-gray-600">현재 사용 정보를 입력하거나, 원하는 옵션을 선택해 주세요.</p>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center space-x-4 mt-6 md:mt-0 text-sm">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mb-1 shadow-sm">1</div>
            <span className="font-semibold text-gray-900">정보 입력</span>
          </div>
          <div className="w-12 h-[1px] bg-gray-300 -mt-6"></div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold mb-1">2</div>
            <span className="text-gray-400">AI 추천 요금제</span>
          </div>
          <div className="w-12 h-[1px] bg-gray-300 -mt-6"></div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold mb-1">3</div>
            <span className="text-gray-400">비교 및 선택</span>
          </div>
        </div>
      </div>

      {/* Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <OptionCard mode="current" selectedMode={inputMode} onClick={() => setInputMode('current')} />
        <OptionCard mode="custom" selectedMode={inputMode} onClick={() => setInputMode('custom')} />
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm mb-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 ml-1">통신사 선택</label>
              <select name="carrier" defaultValue={defaultCarrier} className="w-full p-3.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium">
                <option value="SKT">SKT</option>
                <option value="KT">KT</option>
                <option value="LGU+">LG U+</option>
                <option value="알뜰폰">알뜰폰</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 ml-1">현재 요금제</label>
              <input name="planName" type="text" defaultValue="5GX 프라임" className="w-full p-3.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 ml-1">월 요금</label>
              <input name="baseFee" type="text" defaultValue="89000" className="w-full p-3.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 ml-1">데이터</label>
              <select name="dataAllowanceGb" defaultValue="무제한" className="w-full p-3.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium">
                <option value="무제한">무제한</option>
                <option value="100">100GB</option>
                <option value="50">50GB</option>
                <option value="10">10GB</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 ml-1">통화</label>
              <select name="voiceAllowanceMin" defaultValue="무제한" className="w-full p-3.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium">
                <option value="무제한">무제한</option>
                <option value="300">300분</option>
                <option value="100">100분</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 ml-1">문자</label>
              <select name="smsAllowance" defaultValue="기본제공" className="w-full p-3.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium">
                <option value="기본제공">기본제공</option>
                <option value="300">300건</option>
              </select>
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
