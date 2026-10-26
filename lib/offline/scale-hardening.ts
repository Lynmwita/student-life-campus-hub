export interface OfflineWriteResult {
  success: boolean;
  queued: boolean;
  queueId?: string;
  error?: string;
  message?: string;
  securityHotline?: string;
}

export interface QueuedOfflineAction {
  id: string;
  action: 'renew_book' | 'claim_item' | 'unit_registration' | 'emergency_sos';
  payload: any;
  queuedAt: number;
  status: 'offline_queued';
}

const LOW_DATA_KEY = 'campus-low-data';
const OFFLINE_QUEUE_KEY = 'campus-offline-write-queue';

/**
 * Checks whether low-data mode is active for bandwidth preservation.
 */
export function isLowDataMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(LOW_DATA_KEY) === 'true';
}

/**
 * Sets low-data mode preference and notifies the application.
 */
export function setLowDataMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOW_DATA_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('campus-low-data-changed', { detail: enabled }));
}

/**
 * Formats a cache timestamp into an honest freshness label.
 * Honesty rule: Never presents stale cached data as live.
 */
export function formatCacheFreshness(
  savedAt: number,
  now: number = Date.now(),
  lang: 'en' | 'sw' = 'en'
): string {
  const diffMs = Math.max(0, now - savedAt);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  let relativeTime = '';
  if (lang === 'sw') {
    if (diffMins < 1) relativeTime = 'sasa hivi';
    else if (diffMins < 60) relativeTime = `dakika ${diffMins} zilizopita`;
    else if (diffHours < 24) relativeTime = `saa ${diffHours} zilizopita`;
    else relativeTime = `zaidi ya saa 24 zilizopita`;

    return `Nakala ya nje ya mtandao: ilihifadhiwa ${relativeTime}`;
  }

  if (diffMins < 1) relativeTime = 'just now';
  else if (diffMins === 1) relativeTime = '1 minute ago';
  else if (diffMins < 60) relativeTime = `${diffMins} minutes ago`;
  else if (diffHours === 1) relativeTime = '1 hour ago';
  else if (diffHours < 24) relativeTime = `${diffHours} hours ago`;
  else relativeTime = 'over 24 hours ago';

  return `Offline copy: last synced ${relativeTime}`;
}

/**
 * Handles action submissions when the device is disconnected.
 * Honesty rule:
 * 1. Emergency SOS must NEVER claim success when offline. It explicitly refuses with provisional hotlines.
 * 2. Routine writes (renewals, registrations, claims) queue visibly in local storage and inform the student that
 *    confirmation from the university server is pending reconnection.
 */
export function handleOfflineWriteAttempt(
  action: QueuedOfflineAction['action'],
  payload: any
): OfflineWriteResult {
  // SOS strictly refuses without connectivity
  if (action === 'emergency_sos') {
    return {
      success: false,
      queued: false,
      error: 'Cannot transmit SOS dispatch without network connectivity. Call campus security or dial national emergency 999/112.',
      securityHotline: '+254 700 000 999 (Provisional Pilot Line)',
    };
  }

  if (typeof window === 'undefined') {
    return {
      success: false,
      queued: false,
      error: 'Offline action queueing unavailable outside client context.',
    };
  }

  const queueId = `OFL-QUEUED-${Date.now()}`;
  const queuedItem: QueuedOfflineAction = {
    id: queueId,
    action,
    payload,
    queuedAt: Date.now(),
    status: 'offline_queued',
  };

  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const existing: QueuedOfflineAction[] = raw ? JSON.parse(raw) : [];
    existing.push(queuedItem);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));

    return {
      success: false,
      queued: true,
      queueId,
      message: `Offline mode: Action saved locally under queue reference ${queueId}. It will be submitted automatically when connectivity is restored.`,
    };
  } catch {
    return {
      success: false,
      queued: false,
      error: 'Device storage full: Could not queue offline request.',
    };
  }
}

/**
 * Retrieves the currently queued offline actions awaiting synchronization.
 */
export function getOfflineQueuedActions(): QueuedOfflineAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clears the offline write queue after synchronization.
 */
export function clearOfflineQueuedActions(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}
