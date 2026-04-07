/**
 * PostHog Analytics Configuration
 * Privacy-first analytics with user consent
 */

'use client';

import React from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PostHogProviderImpl } from 'posthog-js/react';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

// Check if user has consented to analytics
function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;

  const consent = localStorage.getItem('analytics_consent');
  if (consent === 'granted') return true;
  if (consent === 'denied') return false;

  // No consent set, check default
  return process.env.NEXT_PUBLIC_DEFAULT_ANALYTICS_CONSENT === 'true';
}

// Initialize PostHog
export function initPostHog() {
  if (!POSTHOG_KEY || !hasAnalyticsConsent()) {
    console.log('[PostHog] Analytics disabled or no consent');
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage',
    disable_session_recording: true, // Disable session recording for privacy
    disable_compression: false,
    person_profiles: 'identified_only', // Only create profiles for identified users

    // Privacy settings
    disable_persistence: !hasAnalyticsConsent(),
    disable_cookie: true, // Cookie-less tracking
    save_referrer: true,
    capture_copied_text: false, // Don't capture clipboard for privacy

    // Performance
    request_batching: {
      enabled: true,
      flush_interval: 30, // Flush every 30 seconds
      flush_max_items: 100,
    },

    // Mask sensitive data
    property_blacklist: [
      'password',
      'token',
      'api_key',
      'secret',
      'ssn',
      'credit_card',
    ],

    // Don't capture certain elements
    autocapture: false, // Disable autocapture for privacy

    // Before send event
    before_send: (event) => {
      // Remove sensitive data from event properties
      if (event.properties) {
        Object.keys(event.properties).forEach(key => {
          if (key.toLowerCase().includes('password') ||
              key.toLowerCase().includes('token') ||
              key.toLowerCase().includes('secret')) {
            delete event.properties[key];
          }
        });
      }

      return event;
    },

    // Debug mode in development
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') {
        ph.debug();
      }
    },
  });

  console.log('[PostHog] Analytics initialized');
}

// Custom event tracking
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (!POSTHOG_KEY || !hasAnalyticsConsent()) return;

  try {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[PostHog] Failed to track event:', error);
  }
}

// Track page views
export function trackPageView(path: string, properties?: Record<string, any>) {
  trackEvent('$pageview', {
    $current_url: window.location.href,
    pathname: path,
    ...properties,
  });
}

// Track user interactions
export function trackInteraction(action: string, details?: Record<string, any>) {
  trackEvent('user_interaction', {
    action,
    ...details,
  });
}

// Track feature usage
export function trackFeatureUsage(feature: string, details?: Record<string, any>) {
  trackEvent('feature_used', {
    feature,
    ...details,
  });
}

// Track errors
export function trackError(error: Error, context?: Record<string, any>) {
  trackEvent('error_occurred', {
    error_message: error.message,
    error_name: error.name,
    ...context,
  });
}

// Identify user (with anonymized data)
export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (!POSTHOG_KEY || !hasAnalyticsConsent()) return;

  try {
    // Hash user ID for privacy
    const hashedId = 'user_' + simpleHash(userId);

    posthog.identify(hashedId, {
      ...traits,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[PostHog] Failed to identify user:', error);
  }
}

// Reset user (logout)
export function resetUser() {
  if (!POSTHOG_KEY) return;

  try {
    posthog.reset();
  } catch (error) {
    console.error('[PostHog] Failed to reset user:', error);
  }
}

// Set user properties
export function setUserProperties(properties: Record<string, any>) {
  if (!POSTHOG_KEY || !hasAnalyticsConsent()) return;

  try {
    posthog.people.set(properties);
  } catch (error) {
    console.error('[PostHog] Failed to set user properties:', error);
  }
}

// Analytics consent management
export function grantAnalyticsConsent() {
  localStorage.setItem('analytics_consent', 'granted');
  location.reload();
}

export function denyAnalyticsConsent() {
  localStorage.setItem('analytics_consent', 'denied');
  location.reload();

  // Clear PostHog data
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.reset();
  }
}

export function getAnalyticsConsent(): 'granted' | 'denied' | 'unknown' {
  const consent = localStorage.getItem('analytics_consent');
  if (consent === 'granted') return 'granted';
  if (consent === 'denied') return 'denied';
  return 'unknown';
}

// Simple hash function (not cryptographically secure)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// PostHog Provider component
export function PHProvider({ children }: { children: React.ReactNode }) {
  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PostHogProviderImpl client={posthog}>
      {children}
    </PostHogProviderImpl>
  );
}

// Export posthog instance for advanced usage
export { posthog };

export default {
  initPostHog,
  trackEvent,
  trackPageView,
  trackInteraction,
  trackFeatureUsage,
  trackError,
  identifyUser,
  resetUser,
  setUserProperties,
  grantAnalyticsConsent,
  denyAnalyticsConsent,
  getAnalyticsConsent,
  PHProvider,
};
