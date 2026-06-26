import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/molecules/Header';
import DiagnosticForm from '@/components/molecules/DiagnosticForm';
import Link from 'next/link';
import RecommendationList from '@/components/organisms/RecommendationList';

import RecommendationContentClient from '@/components/organisms/RecommendationContentClient';

export default async function Home(props: { searchParams: Promise<{ input_id?: string }> }) {
  const searchParams = await props.searchParams;
  const inputId = searchParams?.input_id;

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col font-sans">
      <Header />
      <main className="flex-1 w-full">
        <Suspense fallback={<div className="flex justify-center mt-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>}>
          <DiagnosticForm />
        </Suspense>

        {inputId && (
          <div className="mt-8 border-t border-gray-200" id="recommendation-result">
            <RecommendationContentClient inputId={inputId} />
          </div>
        )}
      </main>
    </div>
  );
}
