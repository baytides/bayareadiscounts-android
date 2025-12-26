import { StatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Initialize Sentry for crash reporting
Sentry.init({
  dsn: 'https://a901563a7a20408ba654c1012592ac34@o4510598177095680.ingest.us.sentry.io/4510598243745792',
  // Disable in development
  enabled: !__DEV__,
  // Set sample rate for performance monitoring (0.2 = 20% of transactions)
  tracesSampleRate: 0.2,
  // Strip PII from crash reports
  beforeSend(event) {
    // Remove user IP address
    if (event.user) {
      delete event.user.ip_address;
    }
    // Remove device identifiers
    if (event.contexts?.device) {
      delete event.contexts.device.device_id;
    }
    return event;
  },
});

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
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

// Wrap with Sentry for automatic error boundary
export default Sentry.wrap(App);
