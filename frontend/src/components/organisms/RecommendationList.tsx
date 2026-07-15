'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import RecommendationCard from '../molecules/RecommendationCard';
import ConcentricDonutChart from '../atoms/ConcentricDonutChart';
import { ArrowDown, ArrowUp } from 'lucide-react';
import AccordionReveal from '../molecules/AccordionReveal';
import CarrierBadge from '../atoms/CarrierBadge';
import { yogiApi } from '../../lib/api';
import { Loader2 } from 'lucide-react';

export default function RecommendationList({ recommendations, currentFee, inputId }: { recommendations: any[], currentFee: number, inputId: string }) {
  const [showAll, setShowAll] = useState(false);
  const [carrierFilter, setCarrierFilter] = useState('전체');
  const [allRecommendations, setAllRecommendations] = useState<any[]>(recommendations);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setAllRecommendations(recommendations);
  }, [recommendations]);
  
  const topRecommendations = allRecommendations.slice(0, 3);
  const otherRecommendations = allRecommendations.slice(3);

  const handleLoadMore = async () => {
    if (loadingMore) return;
    
    if (allRecommendations.length > 3) {
      setShowAll(true);
      return;
    }

    setLoadingMore(true);
    try {
      const excludedIds = allRecommendations.map(r => r.plan_id);
      const moreData = await yogiApi.getMoreRecommendations(inputId, excludedIds);
      if (moreData.recommended_plans && moreData.recommended_plans.length > 0) {
        setAllRecommendations([...allRecommendations, ...moreData.recommended_plans]);
      } else {
        alert('추가로 추천해 드릴 수 있는 요금제가 없습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('추가 요금제를 불러오지 못했습니다.');
    } finally {
      setLoadingMore(false);
      setShowAll(true);
    }
  };

  const filteredOtherRecommendations = otherRecommendations.filter((rec: any) => {
    if (carrierFilter === '전체') return true;
    
    const baseNetwork = rec.base_network || '';
    
    switch (carrierFilter) {
      case 'SKT망': return baseNetwork.includes('SKT');
      case 'KT망': return baseNetwork.includes('KT');
      case 'LGU+망': return baseNetwork.includes('LGU+');
      default: return true;
    }
  });

  // Temporary dummy values for current plan (until DTO provides actual differences)
  const currentData = 50; 
  const currentVoice = 9999;
  const currentSms = 9999;

  const filters = ['전체', 'SKT망', 'KT망', 'LGU+망'];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topRecommendations.map((rec: any, idx: number) => (
          <RecommendationCard key={idx} idx={idx} rec={rec} currentFee={currentFee} />
        ))}
      </div>
      
      {!showAll && (
        <div className="mt-8 text-center">
          <button 
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-8 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-sm flex items-center justify-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                AI가 추가 요금제를 분석 중입니다...
              </>
            ) : (
              '다른 요금제 더 보기'
            )}
          </button>
        </div>
      )}
          
      <AccordionReveal isOpen={showAll}>
        <div id="step-compare" className="space-y-4 pt-4 scroll-mt-24">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 px-2 space-y-3 md:space-y-0">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">추가 요금제 비교</h3>
                <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
                  {filters.map(filter => (
                    <button 
                      key={filter} 
                      onClick={() => setCarrierFilter(filter)} 
                      className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${carrierFilter === filter ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 dark:text-gray-400 dark:text-slate-500 hover:bg-gray-200'}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col space-y-3">
                {filteredOtherRecommendations.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
                    <p className="text-gray-500 dark:text-gray-400 dark:text-slate-500 font-medium">해당 조건의 요금제가 없습니다.</p>
                  </div>
                ) : (
                  filteredOtherRecommendations.map((rec: any, idx: number) => {
                    const isSaving = rec.expected_savings > 0;
                    const isSame = rec.expected_savings === 0;
                    
                    return (
                      <div key={idx + 3} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col xl:flex-row items-center justify-between shadow-sm hover:shadow-md transition-shadow gap-6">
                        {/* Carrier and Plan Name */}
                        <div className="flex items-center space-x-4 w-full xl:w-1/4">
                          <CarrierBadge name={rec.carrier_name} baseNetwork={rec.base_network} size="md" showName={true} />
                          <h4 className="font-bold text-gray-900 dark:text-white text-base truncate">{rec.plan_name}</h4>
                        </div>
  
                        {/* Price */}
                        <div className="w-full xl:w-1/6 text-left xl:text-center">
                          <p className="text-xl font-bold text-gray-900 dark:text-white">월 {rec.price.toLocaleString()}원</p>
                        </div>
  
                        {/* Mini Charts for Data, Voice, SMS */}
                        <div className="flex items-center justify-between xl:justify-center w-full xl:w-5/12 space-x-4 md:space-x-8">
                          {/* Data */}
                          <div className="flex items-center space-x-3">
                            <ConcentricDonutChart 
                              currentValue={currentData} 
                              recommendedValue={rec.data_allowance} 
                              label="" 
                              colorHex="#3b82f6" 
                              size={40} 
                            />
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-slate-500 font-bold leading-none">데이터</span>
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight mt-1">{rec.data_allowance === 9999 ? '무제한' : `${rec.data_allowance}GB`}</span>
                            </div>
                          </div>
                          {/* Voice */}
                          <div className="flex items-center space-x-3">
                            <ConcentricDonutChart 
                              currentValue={currentVoice} 
                              recommendedValue={9999} 
                              label="" 
                              colorHex="#22c55e" 
                              size={40} 
                            />
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-slate-500 font-bold leading-none">통화</span>
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight mt-1">무제한</span>
                            </div>
                          </div>
                          {/* SMS */}
                          <div className="flex items-center space-x-3">
                            <ConcentricDonutChart 
                              currentValue={currentSms} 
                              recommendedValue={9999} 
                              label="" 
                              colorHex="#fb923c" 
                              size={40} 
                            />
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-slate-500 font-bold leading-none">문자</span>
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight mt-1">기본제공</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <div className="flex items-center justify-end w-full xl:w-auto shrink-0">
                          <a 
                            href={(rec.plan_url && rec.plan_url !== '#') ? rec.plan_url : `https://www.epost.go.kr/comm.alddl.RetrieveAlddlChargeList.comm`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 border border-gray-300 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-lg hover:bg-gray-50 dark:bg-slate-800 transition-colors w-full xl:w-auto text-center inline-block"
                          >
                            자세히 보기 &gt;
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </AccordionReveal>

    </>
  );
}
