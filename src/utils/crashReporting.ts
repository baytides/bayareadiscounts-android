/**
 * Crash Reporting Preferences
 * Manages user opt-in/opt-out for crash reporting via Sentry
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react';

const CRASH_REPORTING_KEY = '@bay_area_discounts:crash_reporting_enabled';

// Default to enabled
let crashReportingEnabled = true;

/**
 * Load the crash reporting preference from storage
 */
export async function loadCrashReportingPreference(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(CRASH_REPORTING_KEY);
    // Default to true if not set
    crashReportingEnabled = value === null ? true : value === 'true';
    return crashReportingEnabled;
  } catch (error) {
    console.error('Failed to load crash reporting preference:', error);
    return true;
  }
}

/**
 * Set the crash reporting preference
 */
export async function setCrashReportingEnabled(enabled: boolean): Promise<void> {
  try {
    crashReportingEnabled = enabled;
    await AsyncStorage.setItem(CRASH_REPORTING_KEY, enabled ? 'true' : 'false');

    // Update Sentry client
    if (enabled) {
      Sentry.init({
        dsn: 'https://a901563a7a20408ba654c1012592ac34@o4510598177095680.ingest.us.sentry.io/4510598243745792',
        enabled: !__DEV__,
        tracesSampleRate: 0.2,
        beforeSend(event) {
          if (event.user) {
            delete event.user.ip_address;
          }
          if (event.contexts?.device) {
            delete event.contexts.device.device_id;
          }
          return event;
        },
      });
    } else {
      // Disable Sentry by closing the client
      Sentry.close();
    }
  } catch (error) {
    console.error('Failed to save crash reporting preference:', error);
  }
}

/**
 * Check if crash reporting is currently enabled
 */
export function isCrashReportingEnabled(): boolean {
  return crashReportingEnabled;
}
