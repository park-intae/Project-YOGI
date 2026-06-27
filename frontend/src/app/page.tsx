import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/molecules/Header';
import DiagnosticForm from '@/components/molecules/DiagnosticForm';
import Link from 'next/link';
import RecommendationList from '@/components/organisms/RecommendationList';

import RecommendationContentClient from '@/components/organisms/RecommendationContentClient';
import VerticalStepper from '@/components/molecules/VerticalStepper';

export default async function Home(props: { searchParams: Promise<{ input_id?: string }> }) {
  const searchParams = await props.searchParams;
  const inputId = searchParams?.input_id;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans relative">
      <Header />
      <VerticalStepper />
      <main className="flex-1 w-full">
        <Suspense fallback={<div className="flex justify-center mt-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>}>
          <DiagnosticForm />
        </Suspense>

        {inputId && (
          <div className="mt-8 border-t border-gray-200 dark:border-slate-700">
            <RecommendationContentClient inputId={inputId} />
          </div>
        )}
      </main>
    </div>
  );
}
