import Link from 'next/link';
import { HelpCircle } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-100 py-4 px-6 flex justify-between items-center sticky top-0 z-10">
      <div className="flex items-center space-x-2">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">Y</div>
          <span className="font-bold text-xl tracking-tight text-gray-900">요금제 비교</span>
        </Link>
      </div>
      <button className="flex items-center text-gray-600 text-sm font-medium border border-gray-200 rounded-full px-4 py-2 hover:bg-gray-50 transition-colors bg-white">
        <HelpCircle size={16} className="mr-1.5" /> 이용 방법
      </button>
    </header>
  );
}
