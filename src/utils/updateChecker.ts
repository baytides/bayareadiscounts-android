/**
 * Update Checker
 * Checks GitHub releases for app updates
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking } from 'react-native';
import appConfig from '../../app.json';

const GITHUB_RELEASES_API = 'https://api.github.com/repos/baytides/bayareadiscounts-android/releases/latest';
const UPDATE_CHECK_KEY = '@bay_area_discounts:last_update_check';
const UPDATE_DISMISSED_KEY = '@bay_area_discounts:dismissed_version';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

interface GitHubRelease {
  tag_name: string;
  name: string;
  html_url: string;
  body: string;
  published_at: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

/**
 * Compare version strings (e.g., "1.0.1" vs "1.0.0")
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  // Remove 'v' prefix if present
  const cleanA = a.replace(/^v/, '');
  const cleanB = b.replace(/^v/, '');

  const partsA = cleanA.split('.').map(Number);
  const partsB = cleanB.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;

    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }

  return 0;
}

/**
 * Check if we should perform an update check
 */
async function shouldCheckForUpdate(): Promise<boolean> {
  try {
    const lastCheck = await AsyncStorage.getItem(UPDATE_CHECK_KEY);
    if (!lastCheck) return true;

    const lastCheckTime = parseInt(lastCheck, 10);
    const now = Date.now();

    return now - lastCheckTime >= CHECK_INTERVAL;
  } catch (error) {
    console.error('Error checking update interval:', error);
    return true;
  }
}

/**
 * Record that we performed an update check
 */
async function recordUpdateCheck(): Promise<void> {
  try {
    await AsyncStorage.setItem(UPDATE_CHECK_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error recording update check:', error);
  }
}

/**
 * Check if user dismissed this version's update prompt
 */
async function isVersionDismissed(version: string): Promise<boolean> {
  try {
    const dismissed = await AsyncStorage.getItem(UPDATE_DISMISSED_KEY);
    return dismissed === version;
  } catch (error) {
    return false;
  }
}

/**
 * Dismiss update prompt for a specific version
 */
async function dismissVersion(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(UPDATE_DISMISSED_KEY, version);
  } catch (error) {
    console.error('Error dismissing version:', error);
  }
}

/**
 * Fetch latest release from GitHub
 */
async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(GITHUB_RELEASES_API, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'BayAreaDiscounts-Android',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        // No releases yet
        return null;
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching latest release:', error);
    return null;
  }
}

/**
 * Show update available dialog
 */
function showUpdateDialog(release: GitHubRelease, downloadUrl: string): void {
  const version = release.tag_name.replace(/^v/, '');

  Alert.alert(
    'Update Available',
    `A new version (${version}) of Bay Area Discounts is available.\n\nWould you like to download it now?`,
    [
      {
        text: 'Later',
        style: 'cancel',
        onPress: () => {
          // Don't dismiss permanently, just skip for now
        },
      },
      {
        text: "Don't Ask Again",
        style: 'destructive',
        onPress: () => {
          dismissVersion(release.tag_name);
        },
      },
      {
        text: 'Download',
        onPress: async () => {
          try {
            await Linking.openURL(downloadUrl);
          } catch (err) {
            Alert.alert('Error', 'Could not open download page');
          }
        },
      },
    ]
  );
}

/**
 * Main function to check for updates
 * Call this on app startup
 */
export async function checkForUpdates(force: boolean = false): Promise<void> {
  try {
    // Check if we should perform a check (unless forced)
    if (!force && !(await shouldCheckForUpdate())) {
      return;
    }

    // Record that we're checking
    await recordUpdateCheck();

    // Fetch latest release
    const release = await fetchLatestRelease();
    if (!release) {
      return;
    }

    // Get current version from app config
    const currentVersion = appConfig.expo.version;
    const latestVersion = release.tag_name;

    // Compare versions
    if (compareVersions(latestVersion, currentVersion) <= 0) {
      // Already on latest or newer version
      return;
    }

    // Check if user dismissed this version
    if (await isVersionDismissed(latestVersion)) {
      return;
    }

    // Find APK download URL
    const apkAsset = release.assets.find(
      (asset) => asset.name.endsWith('.apk')
    );

    // Use APK download URL or fall back to release page
    const downloadUrl = apkAsset?.browser_download_url || release.html_url;

    // Show update dialog
    showUpdateDialog(release, downloadUrl);
  } catch (error) {
    console.error('Error checking for updates:', error);
    // Fail silently - don't bother the user with update check errors
  }
}

/**
 * Get update check info for display in settings
 */
export async function getUpdateCheckInfo(): Promise<{
  lastCheck: Date | null;
  currentVersion: string;
}> {
  try {
    const lastCheck = await AsyncStorage.getItem(UPDATE_CHECK_KEY);
    return {
      lastCheck: lastCheck ? new Date(parseInt(lastCheck, 10)) : null,
      currentVersion: appConfig.expo.version,
    };
  } catch (error) {
    return {
      lastCheck: null,
      currentVersion: appConfig.expo.version,
    };
  }
}

/**
 * Force check for updates (for settings screen "Check for Updates" button)
 */
export async function forceCheckForUpdates(): Promise<{
  hasUpdate: boolean;
  latestVersion: string | null;
  downloadUrl: string | null;
}> {
  try {
    await recordUpdateCheck();

    const release = await fetchLatestRelease();
    if (!release) {
      return { hasUpdate: false, latestVersion: null, downloadUrl: null };
    }

    const currentVersion = appConfig.expo.version;
    const latestVersion = release.tag_name.replace(/^v/, '');
    const hasUpdate = compareVersions(release.tag_name, currentVersion) > 0;

    const apkAsset = release.assets.find((asset) => asset.name.endsWith('.apk'));
    const downloadUrl = apkAsset?.browser_download_url || release.html_url;

    return {
      hasUpdate,
      latestVersion,
      downloadUrl,
    };
  } catch (error) {
    console.error('Error force checking for updates:', error);
    throw error;
  }
}
