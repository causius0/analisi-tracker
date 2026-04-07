/**
 * PWA Utility Functions
 * Handles service worker registration, updates, and PWA-specific features
 */

const SW_URL = '/sw.js';
const SW_VERSION = 'v1';

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface ServiceWorkerUpdate {
  waiting: ServiceWorker;
  update: () => void;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: '/'
    });

    console.log('[PWA] Service Worker registered:', registration);

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available; refresh to get it
            console.log('[PWA] New service worker available');
            notifyUpdateAvailable(registration);
          }
        });
      }
    });

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Every hour

    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Notify user about available update
 */
function notifyUpdateAvailable(registration: ServiceWorkerRegistration) {
  if (registration.waiting) {
    // Send message to waiting service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload page when new service worker activates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
}

/**
 * Request to skip waiting and activate new service worker
 */
export function skipWaiting(): void {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.getRegistration().then((registration) => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      registration.active?.postMessage({ type: 'CLEAR_CACHE' });
      console.log('[PWA] Clear cache message sent');
    }
  } catch (error) {
    console.error('[PWA] Failed to clear cache:', error);
  }
}

/**
 * Get estimated cache size
 */
export async function getCacheSize(): Promise<number> {
  if (!('caches' in window)) return 0;

  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error('[PWA] Failed to calculate cache size:', error);
    return 0;
  }
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Check if app is installed (running as PWA)
 */
export function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
}

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if device is iOS
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Check if device is Android
 */
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/**
 * Get device information
 */
export function getDeviceInfo(): {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isInstalled: boolean;
  userAgent: string;
  language: string;
} {
  return {
    isMobile: isMobile(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isInstalled: isInstalled(),
    userAgent: navigator.userAgent,
    language: navigator.language,
  };
}

/**
 * Handle PWA install prompt
 */
export function setupInstallPrompt(
  onInstallAvailable: (prompt: PWAInstallPrompt) => void,
  onInstallAccepted?: () => void,
  onInstallDismissed?: () => void
): (() => void) | null {
  if (!('beforeinstallprompt' in window)) {
    console.log('[PWA] Install prompts not supported');
    return null;
  }

  const handleBeforeInstallPrompt = (event: Event) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    event.preventDefault();
    console.log('[PWA] Install prompt available');

    // Stash the event so it can be triggered later
    const promptEvent = event as any & PWAInstallPrompt;

    // Notify app that install is available
    onInstallAvailable(promptEvent);
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

  // Listen for app install
  const handleAppInstalled = () => {
    console.log('[PWA] App was installed');
    onInstallAccepted?.();
  };

  window.addEventListener('appinstalled', handleAppInstalled);

  // Return cleanup function
  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', handleAppInstalled);
  };
}

/**
 * Show install prompt
 */
export async function showInstallPrompt(prompt: PWAInstallPrompt): Promise<boolean> {
  try {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Failed to show install prompt:', error);
    return false;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return 'denied';
}

/**
 * Show local notification
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.warn('[PWA] Cannot show notification');
    return;
  }

  try {
    await new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    });
  } catch (error) {
    console.error('[PWA] Failed to show notification:', error);
  }
}

/**
 * Vibrate device (if supported)
 */
export function vibrate(pattern: number | number[]): boolean {
  if ('vibrate' in navigator) {
    return navigator.vibrate(pattern);
  }
  return false;
}

/**
 * Check online status
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function setupNetworkListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Initialize PWA
 */
export async function initPWA(): Promise<{
  registration: ServiceWorkerRegistration | null;
  deviceInfo: ReturnType<typeof getDeviceInfo>;
}> {
  console.log('[PWA] Initializing...');

  // Register service worker
  const registration = await registerServiceWorker();

  // Get device info
  const deviceInfo = getDeviceInfo();

  console.log('[PWA] Device info:', deviceInfo);

  return {
    registration,
    deviceInfo,
  };
}

/**
 * Hook for React components to use PWA features
 */
export function usePWA() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = React.useState<any>(null);
  const [deviceInfo] = React.useState(getDeviceInfo());

  React.useEffect(() => {
    // Network status listeners
    const cleanup = setupNetworkListeners(
      () => setIsOnline(true),
      () => setIsOnline(false)
    );

    // Install prompt listener
    const installCleanup = setupInstallPrompt((prompt) => {
      setInstallPrompt(prompt);
    });

    return () => {
      cleanup();
      installCleanup?.();
    };
  }, []);

  return {
    isOnline,
    installPrompt,
    deviceInfo,
    isInstalled: isInstalled(),
    canInstall: !!installPrompt,
    install: async () => {
      if (installPrompt) {
        return await showInstallPrompt(installPrompt);
      }
      return false;
    },
  };
}

// Import React for the hook
import React from 'react';
