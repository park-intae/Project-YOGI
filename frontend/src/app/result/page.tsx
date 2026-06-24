import { Suspense } from 'react';
import { yogiApi } from '@/lib/api';
import Link from 'next/link';
import Header from '@/components/molecules/Header';
import RecommendationCard from '@/components/molecules/RecommendationCard';

async function getRecommendations(inputId: string) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
  const res = await fetch(`${API_BASE_URL}/sessions/${inputId}/recommendations`, {
    cache: 'no-store', // dynamic
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch recommendations');
  }
  
  return res.json();
}

function LoadingSkeleton() {
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

async function RecommendationContent({ inputId }: { inputId: string }) {
  try {
    const data = await getRecommendations(inputId);
    const recommendations = data.recommendations?.slice(0, 3) || [];
    const currentFee = 89000; // Mock current fee based on design

    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">AI</div>
            <h1 className="text-2xl font-bold text-gray-900">AI 추천 요금제 <span className="text-gray-400 font-normal text-lg ml-1">?</span></h1>
            <p className="text-gray-500 text-sm ml-4 hidden md:block">입력하신 정보를 기반으로 AI가 추천한 요금제입니다.</p>
          </div>
          <button className="text-xs font-medium text-gray-600 border border-gray-200 rounded px-3 py-1.5 flex items-center bg-white hover:bg-gray-50">
            추천 기준 안내 <span className="ml-1 text-gray-400">?</span>
          </button>
        </div>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((rec: any, idx: number) => (
              <RecommendationCard key={idx} idx={idx} rec={rec} currentFee={currentFee} />
            ))}
          </div>
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
  } catch (error) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8 mt-12 text-center border border-red-100">
        <p className="text-red-500 mb-6 font-medium">추천 결과를 불러오는 데 실패했습니다.</p>
        <Link href="/" className="inline-block text-blue-600 hover:text-blue-700 font-medium underline">홈으로 돌아가기</Link>
      </div>
    );
  }
}

export default async function ResultPage(props: { searchParams: Promise<{ input_id?: string }> }) {
  const searchParams = await props.searchParams;
  const inputId = searchParams.input_id;

  if (!inputId) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-100">
            <p className="text-gray-500 mb-6">잘못된 접근입니다.</p>
            <Link href="/" className="text-blue-600 font-medium hover:underline">홈으로 돌아가기</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col font-sans">
      <Header />
      <main className="flex-1 w-full">
        <Suspense fallback={<LoadingSkeleton />}>
          <RecommendationContent inputId={inputId} />
        </Suspense>
      </main>
    </div>
  );
}
