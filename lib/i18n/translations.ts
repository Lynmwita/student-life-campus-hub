import { SupportedLanguage, TranslationDictionary } from './types';

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    // Navigation
    navFeed: 'Campus Feed',
    navFees: 'Fee Statement',
    navStudentId: 'Digital Student ID',
    navLibrary: 'Library',
    navUnits: 'Unit Registration',
    navExams: 'Exam Pass & Timetable',
    navHostels: 'Hostels & Residence',
    navResults: 'Results',
    navTimetable: 'Weekly Timetable',
    navCampusLife: 'Campus Life & Clubs',
    navSafety: 'Community & Safety',
    navGraduation: 'Graduation & Vault',
    navHelpDesk: 'Help Desk & Inquiries',
    navFeedback: 'Pilot feedback',
    navProfile: 'My Academic Profile',
    navSignOut: 'Sign Out',
    navStaffConsole: 'Staff Console',

    // Key Actions & Badges
    actionDownload: 'Download',
    actionClaim: 'Claim Item',
    actionSubmit: 'Submit Request',
    actionCancel: 'Cancel',
    actionDismiss: 'Dismiss',
    actionEmergencySos: 'Emergency SOS',
    badgeLowData: 'Low-Data Mode Active',
    badgeOffline: 'Offline Copy',
    partialTranslationNotice: 'English (Original)',

    // Status & Freshness
    statusLastSynced: 'Last synced',
    statusLive: 'Live Server Connection',
    statusCachedCopy: 'Cached copy from device storage',
    statusPendingConfirmation: 'Pending registrar confirmation',
  },
  sw: {
    // Navigation (Authentic East African university vocabulary)
    navFeed: 'Mlisho wa Chuo',
    navFees: 'Ada za Masomo',
    navStudentId: 'Kitambulisho cha Mwanafunzi',
    navLibrary: 'Maktaba',
    navUnits: 'Usajili wa Kozi',
    navExams: 'Ratiba ya Mitihani & Pasi',
    navHostels: 'Bweni na Makazi',
    navResults: 'Matokeo ya Mitihani',
    navTimetable: 'Ratiba ya Wiki',
    navCampusLife: 'Maisha ya Chuo na Vilabu',
    navSafety: 'Usalama na Faragha',
    navGraduation: 'Utoaji wa Shahada & Kibali',
    navHelpDesk: 'Dawati la Msaada',
    navFeedback: 'Maoni ya Majaribio',
    navProfile: 'Wasifu Wangu wa Masomo',
    navSignOut: 'Toka',
    navStaffConsole: 'Dashibodi ya Wafanyakazi',

    // Key Actions & Badges
    actionDownload: 'Pakua',
    actionClaim: 'Dai Kitu',
    actionSubmit: 'Wasilisha Ombi',
    actionCancel: 'Ghairi',
    actionDismiss: 'Funga',
    actionEmergencySos: 'SOS ya Dharura',
    badgeLowData: 'Hali ya Data Ndogo',
    badgeOffline: 'Nakala ya Nje ya Mtandao',
    partialTranslationNotice: 'Kiswahili (Tafsiri ya Sehemu: Nambari, tarehe, na misimbo ya kozi hubakia bila kubadilika)',

    // Status & Freshness
    statusLastSynced: 'Ilihifadhiwa mara ya mwisho',
    statusLive: 'Imeunganishwa kwenye Seva Moja kwa Moja',
    statusCachedCopy: 'Nakala iliyohifadhiwa kwenye kumbukumbu ya kifaa',
    statusPendingConfirmation: 'Inasubiri uthibitisho wa msajili',
  },
};

/**
 * Returns translated string for the given key and language.
 * Honesty rule: Untranslated keys safely fallback to English. Numbers, codes and dates are never translated.
 */
export function getTranslation(key: keyof TranslationDictionary, lang: SupportedLanguage = 'en'): string {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dictionary[key] || TRANSLATIONS.en[key] || key;
}
