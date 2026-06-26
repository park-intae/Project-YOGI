import { ArrowDown, ArrowUp } from 'lucide-react';
import ConcentricDonutChart from '../atoms/ConcentricDonutChart';

interface RecommendedPlanDto {
  rank: number;
  plan_id: string;
  carrier_name: string;
  plan_name: string;
  price: number;
  data_allowance: number;
  data_speed_limit: number;
  expected_savings: number;
}

interface RecommendationCardProps {
  idx: number;
  rec: RecommendedPlanDto;
  currentFee: number;
}

function DifferenceCircles({ rec, idx }: { rec: RecommendedPlanDto, idx: number }) {
  // Temporary dummy values for current plan (until DTO is updated to provide actual difference data)
  const currentData = 50; 
  const currentVoice = 9999;
  const currentSms = 9999;

  return (
    <div className="flex justify-between items-start mt-6 px-2">
      <div className="flex flex-col items-center">
        <span className="text-xs font-bold text-gray-700 mb-2">데이터</span>
        <ConcentricDonutChart 
          currentValue={currentData} 
          recommendedValue={rec.data_allowance} 
          label={rec.data_allowance === 9999 ? '무제한' : `${rec.data_allowance}GB`} 
          colorHex="#3b82f6" 
          size={56} 
        />
        {/* Mock comparison text */}
        <span className="text-[11px] font-bold text-gray-600 mt-2">
          {rec.data_allowance === currentData ? '동일' : rec.data_allowance > currentData ? '▲ 증가' : '▼ 절감'}
        </span>
      </div>
      
      <div className="flex flex-col items-center">
        <span className="text-xs font-bold text-gray-700 mb-2">통화</span>
        <ConcentricDonutChart 
          currentValue={currentVoice} 
          recommendedValue={9999} // Assuming unlimited for now
          label="무제한" 
          colorHex="#22c55e" 
          size={56} 
        />
        <span className="text-[11px] font-bold text-gray-600 mt-2">동일</span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-xs font-bold text-gray-700 mb-2">문자</span>
        <ConcentricDonutChart 
          currentValue={currentSms} 
          recommendedValue={9999} // Assuming unlimited for now
          label="기본제공" 
          colorHex="#fb923c" 
          size={56} 
        />
        <span className="text-[11px] font-bold text-gray-600 mt-2">동일</span>
      </div>
    </div>
  );
}

export default function RecommendationCard({ idx, rec, currentFee }: RecommendationCardProps) {
  const isSaving = rec.expected_savings > 0;
  const isSame = rec.expected_savings === 0;

  // Set medal styles based on rank (idx 0 = Gold, 1 = Silver, 2 = Bronze)
  let borderClass = 'border border-gray-200 shadow-sm';
  let badgeClass = 'bg-gray-100 text-gray-500';
  let medalLabel = null;

  if (idx === 0) {
    borderClass = 'border-2 border-yellow-400 shadow-md shadow-yellow-100 bg-gradient-to-b from-yellow-50/30 to-white';
    badgeClass = 'bg-yellow-400 text-yellow-900 shadow-sm';
    medalLabel = <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded shadow-sm">👑 1위 강력추천</span>;
  } else if (idx === 1) {
    borderClass = 'border-2 border-gray-300 shadow-md shadow-gray-100 bg-gradient-to-b from-gray-50/50 to-white';
    badgeClass = 'bg-gray-300 text-gray-800 shadow-sm';
    medalLabel = <span className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded">🥈 2위</span>;
  } else if (idx === 2) {
    borderClass = 'border-2 border-amber-500 shadow-md shadow-amber-100 bg-gradient-to-b from-amber-50/20 to-white';
    badgeClass = 'bg-amber-500 text-white shadow-sm';
    medalLabel = <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded">🥉 3위</span>;
  }

  return (
    <div className={`relative rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${borderClass}`}>
      {/* Card Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${badgeClass}`}>
            {idx + 1}
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[8px] font-bold">T</div>
            <span className="text-sm font-semibold text-gray-600">{rec.carrier_name}</span>
          </div>
        </div>
        {medalLabel}
      </div>

      {/* Plan Name & Price */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">{rec.plan_name}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-2">월 {rec.price.toLocaleString()}원</p>
      </div>

      {/* Highlight Box */}
      {!isSame && (
        <div className={`rounded-xl py-4 text-center ${isSaving ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
          <p className="font-bold text-lg flex items-center justify-center">
            월 {Math.abs(rec.expected_savings).toLocaleString()}원 {isSaving ? '절약' : '추가'}
            {isSaving ? <ArrowDown size={18} className="ml-1" /> : <ArrowUp size={18} className="ml-1" />}
          </p>
          <p className={`text-sm mt-1 ${isSaving ? 'text-red-400' : 'text-blue-400'}`}>연 {(Math.abs(rec.expected_savings) * 12).toLocaleString()}원 {isSaving ? '절약' : '추가'}</p>
        </div>
      )}

      {/* Divider */}
      <div className="relative flex py-6 items-center">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink-0 mx-4 text-gray-800 text-xs font-bold">현재 요금제와의 차이</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      {/* Circles */}
      <DifferenceCircles rec={rec} idx={idx} />

      {/* Action Button */}
        <a 
          href={rec.plan_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mt-8 block py-3.5 border border-blue-200 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors text-center"
        >
          자세히 보기
        </a>
    </div>
  );
}
