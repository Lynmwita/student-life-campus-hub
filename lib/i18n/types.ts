export type SupportedLanguage = 'en' | 'sw';

export interface TranslationDictionary {
  // Navigation
  navFeed: string;
  navFees: string;
  navStudentId: string;
  navLibrary: string;
  navUnits: string;
  navExams: string;
  navHostels: string;
  navResults: string;
  navTimetable: string;
  navCampusLife: string;
  navSafety: string;
  navGraduation: string;
  navHelpDesk: string;
  navFeedback: string;
  navProfile: string;
  navSignOut: string;
  navStaffConsole: string;

  // Key Actions & Badges
  actionDownload: string;
  actionClaim: string;
  actionSubmit: string;
  actionCancel: string;
  actionDismiss: string;
  actionEmergencySos: string;
  badgeLowData: string;
  badgeOffline: string;
  partialTranslationNotice: string;

  // Status & Freshness
  statusLastSynced: string;
  statusLive: string;
  statusCachedCopy: string;
  statusPendingConfirmation: string;
}
