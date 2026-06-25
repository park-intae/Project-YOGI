'use client';

import { useState } from 'react';
import RecommendationCard from '@/components/molecules/RecommendationCard';

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherRecommendations.map((rec: any, idx: number) => (
                  <RecommendationCard key={idx + 3} idx={idx + 3} rec={rec} currentFee={currentFee} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
