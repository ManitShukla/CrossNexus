import api from '../services/api';

/**
 * Converts a base64 string to a Uint8Array for VAPID applicationServerKey
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Returns current notification permission state
 */
export function getNotificationPermissionState() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Registers browser with Service Worker and VAPID Push Manager
 */
export async function subscribeToPushNotifications() {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Window is not defined' };
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, message: 'Web Push is not supported on this browser' };
  }

  try {
    // 1. Request user permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, message: 'Notification permission denied by user' };
    }

    // 2. Await active service worker registration
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      return { success: false, message: 'Active Service Worker not detected' };
    }

    // 3. Fetch VAPID public key from backend
    const vapidRes = await api.get('/notifications/vapid-key');
    const publicKey = vapidRes.data?.publicKey;

    if (!publicKey) {
      return { success: false, message: 'Server did not return a valid VAPID public key' };
    }

    // 4. Subscribe to PushManager
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // 5. Send subscription to server
    await api.post('/notifications/subscribe', {
      subscription: subscription.toJSON ? subscription.toJSON() : subscription,
    });

    console.log('[PUSH_REGISTERED] Browser enrolled in VAPID Push Protocol.');
    return { success: true, subscription };
  } catch (err) {
    console.error('[PUSH_REGISTER_FAIL]', err);
    return { success: false, message: err.message || 'Push enrollment failed' };
  }
}

export default {
  subscribeToPushNotifications,
  getNotificationPermissionState,
};
