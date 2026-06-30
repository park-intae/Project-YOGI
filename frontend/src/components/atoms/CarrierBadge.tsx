import React from 'react';
import Image from 'next/image';
import { getLogoSrc } from '@/lib/carrier';

interface CarrierBadgeProps {
  name: string;
  baseNetwork?: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const CarrierBadge: React.FC<CarrierBadgeProps> = ({ name, baseNetwork = 'SKT망', size = 'md', showName = true }) => {
  const logoSrc = getLogoSrc(baseNetwork);
  
  const sizeClasses = {
    sm: 'w-5 h-5 p-[2px]',
    md: 'w-8 h-8 p-[5px]',
    lg: 'w-10 h-10 p-[6px]',
  };
  
  const imgSize = size === 'sm' ? '16px' : size === 'md' ? '24px' : '32px';

  return (
    <div className="flex items-center space-x-1.5">
      <div className={`relative rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-slate-700 shadow-sm bg-white flex items-center justify-center ${sizeClasses[size]}`}>
        <Image src={logoSrc} alt={baseNetwork} fill sizes={imgSize} className="object-contain" />
      </div>
      
      {showName && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{name}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarrierBadge;
