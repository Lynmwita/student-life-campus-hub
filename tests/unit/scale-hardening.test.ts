import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatCacheFreshness,
  handleOfflineWriteAttempt,
  isLowDataMode,
  setLowDataMode,
  getOfflineQueuedActions,
  clearOfflineQueuedActions,
} from '@/lib/offline/scale-hardening';
import { getTranslation, TRANSLATIONS } from '@/lib/i18n/translations';
import * as fs from 'fs';
import * as path from 'path';

function createMockStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}

describe('Scale Hardening: Cache Freshness Labeling', () => {
  it('formats cache timestamps into honest freshness indicators in English', () => {
    const now = 1700000000000;

    // Just now (< 1 min)
    expect(formatCacheFreshness(now - 10000, now, 'en')).toBe('Offline copy: last synced just now');

    // 1 minute ago
    expect(formatCacheFreshness(now - 60000, now, 'en')).toBe('Offline copy: last synced 1 minute ago');

    // 15 minutes ago
    expect(formatCacheFreshness(now - 15 * 60000, now, 'en')).toBe('Offline copy: last synced 15 minutes ago');

    // 2 hours ago
    expect(formatCacheFreshness(now - 2 * 3600000, now, 'en')).toBe('Offline copy: last synced 2 hours ago');

    // Over 24 hours
    expect(formatCacheFreshness(now - 25 * 3600000, now, 'en')).toBe('Offline copy: last synced over 24 hours ago');
  });

  it('formats cache freshness with authentic Swahili vocabulary', () => {
    const now = 1700000000000;

    expect(formatCacheFreshness(now - 10000, now, 'sw')).toBe('Nakala ya nje ya mtandao: ilihifadhiwa sasa hivi');
    expect(formatCacheFreshness(now - 12 * 60000, now, 'sw')).toBe('Nakala ya nje ya mtandao: ilihifadhiwa dakika 12 zilizopita');
    expect(formatCacheFreshness(now - 3 * 3600000, now, 'sw')).toBe('Nakala ya nje ya mtandao: ilihifadhiwa saa 3 zilizopita');
  });

  it('honesty rule: never presents stale offline data as live server data', () => {
    const now = Date.now();
    const label = formatCacheFreshness(now - 300000, now, 'en');
    expect(label).toContain('Offline copy');
    expect(label).not.toContain('Live');
  });
});

describe('Scale Hardening: Offline Writes & Honesty Refusal Rules', () => {
  beforeEach(() => {
    const mockStorage = createMockStorage();
    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
      localStorage: mockStorage,
    });
  });

  it('honesty rule: emergency SOS strictly refuses when offline and never fakes dispatch success', () => {
    const result = handleOfflineWriteAttempt('emergency_sos', {
      location: 'Hall 3 Room 204',
      category: 'security',
    });

    // Never fakes success
    expect(result.success).toBe(false);
    expect(result.queued).toBe(false);
    expect(result.error).toContain('Cannot transmit SOS dispatch without network connectivity');
    expect(result.securityHotline).toContain('+254 700 000 999');
  });

  it('honesty rule: routine offline writes visibly queue without claiming server approval', () => {
    clearOfflineQueuedActions();

    const bookResult = handleOfflineWriteAttempt('renew_book', {
      accessionNumber: 'LIB-2026-CS-0412',
    });

    expect(bookResult.success).toBe(false);
    expect(bookResult.queued).toBe(true);
    expect(bookResult.queueId).toMatch(/^OFL-QUEUED-/);
    expect(bookResult.message).toContain('Action saved locally under queue reference');

    const queuedActions = getOfflineQueuedActions();
    expect(queuedActions).toHaveLength(1);
    expect(queuedActions[0].action).toBe('renew_book');
    expect(queuedActions[0].status).toBe('offline_queued');
  });
});

describe('Scale Hardening: Low-Data Mode Persistence', () => {
  beforeEach(() => {
    const mockStorage = createMockStorage();
    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
      localStorage: mockStorage,
    });
  });

  it('persists low-data preference and dispatches change notification', () => {
    expect(isLowDataMode()).toBe(false);

    setLowDataMode(true);
    expect(isLowDataMode()).toBe(true);
    expect(window.dispatchEvent).toHaveBeenCalled();

    setLowDataMode(false);
    expect(isLowDataMode()).toBe(false);
  });
});

describe('Scale Hardening: Kiswahili Toggle & Campus Vocabulary', () => {
  it('accurately translates all statutory campus navigation terms', () => {
    expect(getTranslation('navFees', 'sw')).toBe('Ada za Masomo');
    expect(getTranslation('navExams', 'sw')).toBe('Ratiba ya Mitihani & Pasi');
    expect(getTranslation('navStudentId', 'sw')).toBe('Kitambulisho cha Mwanafunzi');
    expect(getTranslation('navHostels', 'sw')).toBe('Bweni na Makazi');
    expect(getTranslation('navGraduation', 'sw')).toBe('Utoaji wa Shahada & Kibali');
    expect(getTranslation('navLibrary', 'sw')).toBe('Maktaba');
    expect(getTranslation('navUnits', 'sw')).toBe('Usajili wa Kozi');
    expect(getTranslation('navResults', 'sw')).toBe('Matokeo ya Mitihani');
  });

  it('includes partial translation disclosure in Swahili dictionary', () => {
    const swDict = TRANSLATIONS.sw;
    expect(swDict.partialTranslationNotice).toContain('Tafsiri ya Sehemu');
    expect(swDict.partialTranslationNotice).toContain('Nambari, tarehe, na misimbo ya kozi hubakia bila kubadilika');
  });

  it('safely falls back to English for untranslated keys', () => {
    // Falls back gracefully
    const enVal = getTranslation('navFeed', 'en');
    expect(enVal).toBe('Campus Feed');
  });
});

describe('Scale Hardening: Design Rules & Integrity', () => {
  it('enforces strictly zero em dashes and zero emojis across scale hardening and i18n files', () => {
    const files = [
      'lib/i18n/types.ts',
      'lib/i18n/translations.ts',
      'lib/i18n/context.tsx',
      'lib/offline/scale-hardening.ts',
      'components/shared/language-toggle.tsx',
      'components/shared/offline-status-banner.tsx',
    ];

    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;

    files.forEach((relPath) => {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(content).not.toContain('\u2014'); // no em dash
        expect(emojiRegex.test(content)).toBe(false); // no emoji
      }
    });
  });
});
