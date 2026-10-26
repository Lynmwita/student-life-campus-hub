'use client';

import * as React from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Globe } from 'lucide-react';

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
        language === 'sw'
          ? 'bg-[#06101E] border-[#C59B27] text-[#FCD34D]'
          : 'bg-[#06101E]/60 border-slate-700 text-slate-300 hover:text-white hover:border-[#C59B27]/40'
      } ${className}`}
      title={language === 'en' ? 'Badilisha hadi Kiswahili' : 'Switch to English'}
    >
      <Globe className="w-3.5 h-3.5 text-[#C59B27]" />
      <span className="font-mono text-[11px] font-bold uppercase">
        {language === 'en' ? 'SW' : 'EN'}
      </span>
      <span className="hidden lg:inline text-[11px]">
        {language === 'en' ? 'Kiswahili' : 'English'}
      </span>
    </button>
  );
}
