'use client';

import { useEffect, useState } from 'react';
import { yogiApi, RecommendationResponseDto } from '@/lib/api';
import Link from 'next/link';
import RecommendationList from './RecommendationList';
import { Loader2 } from 'lucide-react';

export default function RecommendationContentClient({ inputId }: { inputId: string }) {
  const [data, setData] = useState<RecommendationResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await yogiApi.getRecommendations(inputId);
        setData(response);
      } catch (err: any) {
        console.error('Failed to fetch recommendations:', err);
        setError('추천 결과를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [inputId]);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-white rounded-2xl shadow-sm border border-gray-100 p-6"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8 mt-12 text-center border border-red-100">
        <p className="text-red-500 mb-6 font-medium">{error || '데이터가 없습니다.'}</p>
        <Link href="/" className="inline-block text-blue-600 hover:text-blue-700 font-medium underline">홈으로 돌아가기</Link>
      </div>
    );
  }

  const recommendations = data.recommended_plans || [];
  const aiSummary = data.ai_summary_comment || '';
  const currentFee = 89000; // Mock current fee based on design

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">AI</div>
          <h1 className="text-2xl font-bold text-gray-900">AI 추천 요금제</h1>
          <p className="text-gray-500 text-sm ml-4 hidden md:block">입력하신 정보를 기반으로 AI가 추천한 요금제입니다.</p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowCriteriaModal(!showCriteriaModal)}
            className="text-xs font-medium text-gray-600 border border-gray-200 rounded px-3 py-1.5 flex items-center bg-white hover:bg-gray-50"
          >
            추천 기준 안내 <span className="ml-1 text-gray-400">?</span>
          </button>

          {showCriteriaModal && (
            <>
              {/* Invisible overlay to detect clicks outside the popover */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowCriteriaModal(false)}
              ></div>
              
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <h3 className="text-base font-bold text-gray-900 mb-3">AI 추천 기준 안내</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>YOGI의 AI 요금제 추천은 다음 기준을 바탕으로 분석됩니다:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong className="text-gray-800">사용량 분석:</strong> 현재 사용 중인 데이터, 통화, 문자 사용 패턴을 최우선으로 충족합니다.</li>
                    <li><strong className="text-gray-800">선호 조건 반영:</strong> 희망하는 통신사(알뜰폰 포함)와 최대 예산 한도를 철저히 준수합니다.</li>
                    <li><strong className="text-gray-800">최대 절약:</strong> 연간 절약 금액이 가장 큰 요금제를 우선 추천합니다.</li>
                  </ul>
                  <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">※ 통신사 정책 변경에 따라 실제 혜택과 약간의 차이가 있을 수 있습니다.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {aiSummary && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800 font-medium">{aiSummary}</p>
        </div>
      )}

      {recommendations.length > 0 ? (
        <RecommendationList recommendations={recommendations} currentFee={currentFee} />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <p className="text-gray-500">추천 결과가 없습니다.</p>
          <Link href="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg mt-6 transition-colors">
            다시 진단하기
          </Link>
        </div>
      )}
    </div>
  );
}
