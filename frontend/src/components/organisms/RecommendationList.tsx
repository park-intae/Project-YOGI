'use client';

import { useState } from 'react';
import RecommendationCard from '@/components/molecules/RecommendationCard';
import { ArrowDown, ArrowUp } from 'lucide-react';

export default function RecommendationList({ recommendations, currentFee }: { recommendations: any[], currentFee: number }) {
  const [showAll, setShowAll] = useState(false);
  
  const topRecommendations = recommendations.slice(0, 3);
  const otherRecommendations = recommendations.slice(3);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topRecommendations.map((rec: any, idx: number) => (
          <RecommendationCard key={idx} idx={idx} rec={rec} currentFee={currentFee} />
        ))}
      </div>
      
      {otherRecommendations.length > 0 && (
        <div className="mt-8">
          {!showAll ? (
            <div className="text-center">
              <button 
                onClick={() => setShowAll(true)}
                className="px-8 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
              >
                다른 요금제 더 보기
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">추가 요금제 비교</h3>
              <div className="flex flex-col space-y-3">
                {otherRecommendations.map((rec: any, idx: number) => {
                  const isSaving = rec.expected_savings > 0;
                  const isSame = rec.expected_savings === 0;
                  
                  return (
                    <div key={idx + 3} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col xl:flex-row items-center justify-between shadow-sm hover:shadow-md transition-shadow gap-6">
                      {/* Carrier and Plan Name */}
                      <div className="flex items-center space-x-4 w-full xl:w-1/4">
                        <div className="flex items-center space-x-2 shrink-0">
                          <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">T</div>
                          <span className="text-base font-bold text-gray-700">{rec.carrier_name}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-base truncate">{rec.plan_name}</h4>
                      </div>

                      {/* Price */}
                      <div className="w-full xl:w-1/6 text-left xl:text-center">
                        <p className="text-xl font-bold text-gray-900">월 {rec.price.toLocaleString()}원</p>
                      </div>

                      {/* Mini Charts for Data, Voice, SMS */}
                      <div className="flex items-center justify-between xl:justify-center w-full xl:w-5/12 space-x-4 md:space-x-8">
                        {/* Data */}
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full border-[5px] border-blue-500"></div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-bold leading-none">데이터</span>
                            <span className="text-sm font-bold text-gray-800 leading-tight mt-1">{rec.data_allowance === 9999 ? '무제한' : `${rec.data_allowance}GB`}</span>
                          </div>
                        </div>
                        {/* Voice */}
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full border-[5px] border-green-500"></div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-bold leading-none">통화</span>
                            <span className="text-sm font-bold text-gray-800 leading-tight mt-1">무제한</span>
                          </div>
                        </div>
                        {/* SMS */}
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full border-[5px] border-orange-400"></div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-bold leading-none">문자</span>
                            <span className="text-sm font-bold text-gray-800 leading-tight mt-1">기본제공</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <div className="flex items-center justify-end w-full xl:w-auto shrink-0">
                        <a 
                          href={rec.plan_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors w-full xl:w-auto text-center inline-block"
                        >
                          자세히 보기 &gt;
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
