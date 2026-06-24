import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/molecules/Header';
import DiagnosticForm from '@/components/molecules/DiagnosticForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col font-sans">
      <Header />
      <main className="flex-1 w-full">
        <Suspense fallback={<div className="flex justify-center mt-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>}>
          <DiagnosticForm />
        </Suspense>
      </main>
    </div>
  );
}
