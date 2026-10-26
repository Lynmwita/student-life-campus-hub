'use client';

import * as React from 'react';
import { WifiOff, Zap, RefreshCw, Info } from 'lucide-react';
import {
  formatCacheFreshness,
  isLowDataMode,
  setLowDataMode,
} from '@/lib/offline/scale-hardening';
import { useLanguage } from '@/lib/i18n/context';

export function OfflineStatusBanner() {
  const { language } = useLanguage();
  const [isOffline, setIsOffline] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null);
  const [lowData, setLowData] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOffline(!navigator.onLine);
    setLowData(isLowDataMode());

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    const handleOfflineUsed = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (customEvent.detail) {
        setLastSavedAt(customEvent.detail);
      }
    };

    const handleLowDataChanged = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setLowData(customEvent.detail);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('campus-offline-used', handleOfflineUsed);
    window.addEventListener('campus-low-data-changed', handleLowDataChanged);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('campus-offline-used', handleOfflineUsed);
      window.removeEventListener('campus-low-data-changed', handleLowDataChanged);
    };
  }, []);

  const toggleLowData = () => {
    const next = !lowData;
    setLowData(next);
    setLowDataMode(next);
  };

  if (!isOffline && !lowData) {
    return null;
  }

  return (
    <div className="bg-[#0B1D33] text-white border-b border-[#C59B27]/40 px-4 py-2 text-xs">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isOffline ? (
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Zap className="w-4 h-4 text-[#FCD34D] shrink-0" />
          )}

          <span>
            {isOffline ? (
              <strong>
                {lastSavedAt
                  ? formatCacheFreshness(lastSavedAt, Date.now(), language)
                  : language === 'sw'
                  ? 'Hali ya Nje ya Mtandao: Unaangazia nakala zilizohifadhiwa.'
                  : 'Offline Mode: Displaying device-cached records.'}
              </strong>
            ) : (
              <span>
                {language === 'sw'
                  ? 'Hali ya Data Ndogo Imewashwa: Picha na upakuaji mkubwa umezuiwa ili kuokoa bando.'
                  : 'Low-Data Mode Active: Image prefetching disabled to preserve mobile bundles.'}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleLowData}
            className={`font-mono text-[11px] px-2 py-0.5 rounded border transition-colors ${
              lowData
                ? 'bg-[#C59B27] text-[#0B1D33] font-bold border-[#FCD34D]'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            {lowData
              ? language === 'sw'
                ? 'Data Ndogo: Imewashwa'
                : 'Low-Data: ON'
              : language === 'sw'
              ? 'Washa Data Ndogo'
              : 'Enable Low-Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
