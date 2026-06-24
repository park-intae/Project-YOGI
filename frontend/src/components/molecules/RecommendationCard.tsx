import { ArrowDown, ArrowUp } from 'lucide-react';

interface Plan {
  carrier: string;
  planName: string;
  baseFee: number;
  dataAllowanceGb: number;
  voiceAllowanceMin: number;
}

interface RecommendationCardProps {
  idx: number;
  rec: {
    plan?: Plan;
    reason?: string;
  };
  currentFee: number;
}

function DifferenceCircles({ rec, idx }: { rec: any, idx: number }) {
  const dataColor = 'border-blue-500';
  const voiceColor = 'border-green-500';
  const smsColor = 'border-orange-400';

  return (
    <div className="flex justify-between items-start mt-6 px-2">
      <div className="flex flex-col items-center">
        <span className="text-xs font-bold text-gray-700 mb-2">데이터</span>
        <div className={`w-14 h-14 rounded-full border-4 ${dataColor} flex items-center justify-center`}></div>
        <span className="text-[10px] text-gray-500 text-center mt-2 whitespace-pre-line leading-tight">
          {idx === 1 ? '▼ 무제한 대비\n여유 100GB' : (rec.plan?.dataAllowanceGb === 9999 ? '무제한' : '무제한')}
        </span>
        {idx !== 1 && <span className="text-[11px] font-bold text-gray-600 mt-1">동일</span>}
      </div>
      <div className="flex flex-col items-center">
        <span className="text-xs font-bold text-gray-700 mb-2">통화</span>
        <div className={`w-14 h-14 rounded-full border-4 ${voiceColor} flex items-center justify-center`}></div>
        <span className="text-[10px] text-gray-500 text-center mt-2">{rec.plan?.voiceAllowanceMin === 9999 ? '무제한' : '무제한'}</span>
        <span className="text-[11px] font-bold text-gray-600 mt-1">동일</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-xs font-bold text-gray-700 mb-2">문자</span>
        <div className={`w-14 h-14 rounded-full border-4 ${smsColor} flex items-center justify-center`}></div>
        <span className="text-[10px] text-gray-500 text-center mt-2">기본제공</span>
        <span className="text-[11px] font-bold text-gray-600 mt-1">동일</span>
      </div>
    </div>
  );
}

export default function RecommendationCard({ idx, rec, currentFee }: RecommendationCardProps) {
  const diff = currentFee - (rec.plan?.baseFee || 0);
  const isSaving = diff > 0;
  const isSame = diff === 0;

  return (
    <div className={`relative bg-white rounded-2xl p-6 ${idx === 0 ? 'border-2 border-blue-600 shadow-md' : 'border border-gray-200 shadow-sm'}`}>
      {/* Card Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {idx + 1}
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[8px] font-bold">T</div>
            <span className="text-sm font-semibold text-gray-600">{rec.plan?.carrier}</span>
          </div>
        </div>
        {idx === 0 && (
          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded">추천</span>
        )}
      </div>

      {/* Plan Name & Price */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">{rec.plan?.planName || '추천 요금제'}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-2">월 {(rec.plan?.baseFee || 0).toLocaleString()}원</p>
      </div>

      {/* Highlight Box */}
      {!isSame && (
        <div className={`rounded-xl py-4 text-center ${isSaving ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
          <p className="font-bold text-lg flex items-center justify-center">
            월 {Math.abs(diff).toLocaleString()}원 {isSaving ? '절약' : '추가'}
            {isSaving ? <ArrowDown size={18} className="ml-1" /> : <ArrowUp size={18} className="ml-1" />}
          </p>
          <p className={`text-sm mt-1 ${isSaving ? 'text-red-400' : 'text-blue-400'}`}>연 {(Math.abs(diff) * 12).toLocaleString()}원 {isSaving ? '절약' : '추가'}</p>
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
      <button className="w-full mt-8 py-3.5 border border-blue-200 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">
        자세히 보기
      </button>
      
      {/* Reason Text below button */}
      <p className="text-xs text-gray-400 mt-4 text-center line-clamp-2">{rec.reason}</p>
    </div>
  );
}
