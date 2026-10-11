import { useState, useEffect, useCallback } from 'react';

const LOCAL_STORAGE_TIMETABLE_KEY = 'nsut_offline_timetable_matrix';

/**
 * Tactical Offline Timetable Resilience Hook
 * Monitors browser uplink state (online/offline) and provides local storage fallback.
 */
export function useOfflineTimetable() {
  const [isOffline, setIsOffline] = useState(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  const [isFromCache, setIsFromCache] = useState(false);
  const [cachedTimestamp, setCachedTimestamp] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_TIMETABLE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.timestamp || null;
      }
    } catch (e) {
      /* ignore */
    }
    return null;
  });

  // Track online / offline transitions
  useEffect(() => {
    const handleOnline = () => {
      console.log('[NETWORK_UPLINK] Internet connectivity restored. Disengaging offline mode.');
      setIsOffline(false);
    };

    const handleOffline = () => {
      console.warn('[NETWORK_SEVERED] Internet connection lost. Engaging autonomous offline cache.');
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Persists authoritative schedule matrix to local resilient cache
   */
  const saveTimetableLocally = useCallback((timetableData, cohort) => {
    if (!timetableData) return;
    try {
      const payload = {
        cohort: cohort || {
          branch: timetableData.branch,
          semester: timetableData.semester,
          section: timetableData.section,
        },
        data: timetableData,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_TIMETABLE_KEY, JSON.stringify(payload));
      setCachedTimestamp(payload.timestamp);
    } catch (err) {
      console.warn('[OFFLINE_CACHE_WRITE_FAIL]', err);
    }
  }, []);

  /**
   * Retrieves stored schedule matrix from local resilient cache
   */
  const loadTimetableLocally = useCallback((requestedCohort) => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_TIMETABLE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      if (parsed && parsed.data) {
        setIsFromCache(true);
        return parsed.data;
      }
    } catch (err) {
      console.warn('[OFFLINE_CACHE_READ_FAIL]', err);
    }
    return null;
  }, []);

  return {
    isOffline,
    isFromCache,
    setIsFromCache,
    saveTimetableLocally,
    loadTimetableLocally,
    cachedTimestamp,
  };
}

export default useOfflineTimetable;
