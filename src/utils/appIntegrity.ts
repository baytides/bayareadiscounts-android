/**
 * App Integrity verification using Google Play Integrity API
 * Verifies the app is running on a genuine device with unmodified code
 */

import * as AppIntegrity from '@expo/app-integrity';
import { Platform } from 'react-native';

// Azure Function endpoint for verifying integrity tokens
const INTEGRITY_VERIFY_URL = 'https://baytides-integrity.azurewebsites.net/api/verifyIntegrity';

// Google Cloud Project Number (from Google Cloud Console)
// This should match your Play Console linked project
const CLOUD_PROJECT_NUMBER = '359306552386';

export interface IntegrityResult {
  valid: boolean;
  deviceIntegrity?: string[];
  appIntegrity?: string;
  error?: string;
}

let isInitialized = false;

/**
 * Initialize the Play Integrity token provider
 * Should be called early in app lifecycle (e.g., on app start)
 */
export async function initializeIntegrity(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    // Play Integrity is Android-only
    return false;
  }

  if (!CLOUD_PROJECT_NUMBER) {
    console.warn('App Integrity: Missing CLOUD_PROJECT_NUMBER');
    return false;
  }

  if (isInitialized) {
    return true;
  }

  try {
    await AppIntegrity.prepareIntegrityToken({
      cloudProjectNumber: CLOUD_PROJECT_NUMBER,
    });
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('Failed to initialize Play Integrity:', error);
    return false;
  }
}

/**
 * Request and verify app integrity
 * Returns whether the app is running in a genuine environment
 */
export async function verifyAppIntegrity(): Promise<IntegrityResult> {
  if (Platform.OS !== 'android') {
    // On non-Android platforms, skip verification
    return { valid: true };
  }

  if (!isInitialized) {
    const initialized = await initializeIntegrity();
    if (!initialized) {
      return {
        valid: false,
        error: 'Integrity not initialized'
      };
    }
  }

  try {
    // Request integrity token from Google
    const token = await AppIntegrity.requestIntegrityToken();

    if (!token) {
      return {
        valid: false,
        error: 'No integrity token received'
      };
    }

    // Send token to our Azure Function for verification
    const response = await fetch(INTEGRITY_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ integrityToken: token }),
    });

    if (!response.ok) {
      return {
        valid: false,
        error: `Verification failed: ${response.status}`
      };
    }

    const result = await response.json();
    return result as IntegrityResult;

  } catch (error) {
    console.error('Integrity verification error:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if the current environment passes basic integrity checks
 * This is a softer check - returns true if we can't verify (graceful degradation)
 */
export async function isGenuineEnvironment(): Promise<boolean> {
  try {
    const result = await verifyAppIntegrity();
    // If we can't verify (e.g., no network, missing config),
    // allow the app to continue
    if (result.error) {
      console.warn('Integrity check skipped:', result.error);
      return true;
    }
    return result.valid;
  } catch {
    // On any error, allow graceful degradation
    return true;
  }
}
