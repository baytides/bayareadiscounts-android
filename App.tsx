import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { initializeSentry, loadCrashReportingPreference } from './src/utils/crashReporting';
import { checkForUpdates } from './src/utils/updateChecker';
import appConfig from './app.json';

function AppContent() {
  const { isDark } = useTheme();
  return (
    <>
      <AppNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const crashReportingEnabled = await loadCrashReportingPreference();
      if (crashReportingEnabled) {
        initializeSentry(
          appConfig.expo.version,
          appConfig.expo.android.versionCode
        );
      }
      setReady(true);

      // Check for updates after app is ready (non-blocking)
      // Small delay to let the app fully initialize first
      setTimeout(() => {
        checkForUpdates();
      }, 2000);
    }
    init();
  }, []);

  // Don't render until we've checked the preference
  if (!ready) {
    return null;
  }

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default Sentry.wrap(App);
