/**
 * Crash Reporting Utility
 * Privacy-friendly Sentry configuration for error tracking
 */

import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CRASH_REPORTING_KEY = '@crash_reporting_enabled';

// Initialize Sentry with privacy-friendly settings
export function initializeSentry(version: string, versionCode: number) {
  Sentry.init({
    dsn: 'https://a901563a7a20408ba654c1012592ac34@o4510598177095680.ingest.us.sentry.io/4510598243745792',
    // Disable in development
    enabled: !__DEV__,
    // Release tracking
    release: `org.baytides.bayareadiscounts@${version}+${versionCode}`,
    environment: __DEV__ ? 'development' : 'production',
    // Privacy settings - disable performance tracing
    tracesSampleRate: 0,
    // Don't send default PII
    sendDefaultPii: false,
    // Disable session tracking for privacy
    enableAutoSessionTracking: false,
    // Strip PII from crash reports
    beforeSend(event) {
      // Remove user IP address
      if (event.user) {
        delete event.user.ip_address;
        delete event.user.email;
        delete event.user.username;
      }
      // Remove device identifiers
      if (event.contexts?.device) {
        delete event.contexts.device.device_id;
      }
      return event;
    },
  });
}

// Load crash reporting preference from storage
export async function loadCrashReportingPreference(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(CRASH_REPORTING_KEY);
    // Default to true if not set
    return value === null ? true : value === 'true';
  } catch {
    return true;
  }
}

// Save crash reporting preference
export async function setCrashReportingEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(CRASH_REPORTING_KEY, enabled.toString());
  } catch {
    // Ignore storage errors
  }
}
