/**
 * Settings Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import APIService from '../services/api';
import appConfig from '../../app.json';
import { useTheme } from '../context/ThemeContext';

const version = appConfig.expo.version;

// Format bytes into a human-readable string
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function SettingsScreen() {
  const { colors, mode, setMode, isDark } = useTheme();
  const [cacheSize, setCacheSize] = useState<string>('Calculating...');
  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    loadMetadata();
    calculateCacheSize();
  }, []);

  const loadMetadata = async () => {
    try {
      const meta = await APIService.getMetadata();
      setMetadata(meta);
    } catch (err) {
      console.error('Load metadata error:', err);
    }
  };

  const calculateCacheSize = async () => {
    try {
      const size = await APIService.getCacheSize();
      setCacheSize(formatBytes(size));
    } catch (err) {
      console.error('Calculate cache size error:', err);
      setCacheSize('Error');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached program data. The app will re-download data on next use.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await APIService.clearCache();
              setCacheSize('0 Bytes');
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (err) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleOpenWebsite = async () => {
    const url = 'https://bayareadiscounts.com';
    try {
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Error', 'Failed to open website');
    }
  };

  const handleOpenBayTides = async () => {
    const url = 'https://baytides.org';
    try {
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Error', 'Failed to open website');
    }
  };

  const handleDonate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = 'https://baytides.org/donate';
    try {
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Error', 'Failed to open donation page');
    }
  };

  const handleReportIssue = async () => {
    const url = 'https://github.com/baytides/mobile-apps/issues';
    try {
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Error', 'Failed to open issue tracker');
    }
  };

  const handleSendFeedback = () => {
    Alert.alert(
      'Send Feedback',
      'How would you like to send feedback?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Bug Report',
          onPress: () => openFeedbackUrl('bug'),
        },
        {
          text: 'Feature Request',
          onPress: () => openFeedbackUrl('feature'),
        },
        {
          text: 'General Feedback',
          onPress: () => openFeedbackUrl('general'),
        },
      ]
    );
  };

  const openFeedbackUrl = async (type: 'bug' | 'feature' | 'general') => {
    const labels: Record<string, string> = {
      bug: 'bug',
      feature: 'enhancement',
      general: 'feedback',
    };
    const titles: Record<string, string> = {
      bug: '[Bug] ',
      feature: '[Feature Request] ',
      general: '[Feedback] ',
    };

    const params = new URLSearchParams({
      labels: labels[type],
      title: titles[type],
      body: `\n\n---\n**Platform:** Android\n**App Version:** ${version}\n**Submitted via:** Mobile App`,
    });

    const url = `https://github.com/baytides/bayareadiscounts/issues/new?${params.toString()}`;

    try {
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Error', 'Failed to open feedback form');
    }
  };

  const handleThemeChange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Appearance',
      'Choose your preferred theme',
      [
        {
          text: 'Light',
          onPress: () => setMode('light'),
        },
        {
          text: 'Dark',
          onPress: () => setMode('dark'),
        },
        {
          text: 'System',
          onPress: () => setMode('system'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getThemeModeLabel = () => {
    switch (mode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* Logo Banner */}
        <View style={[styles.logoContainer, { backgroundColor: colors.surface }]}>
          <Image
            source={require('../../assets/images/favicons/web-app-manifest-512x512.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.logoText, { color: colors.text }]}>Bay Area Discounts</Text>
          <Text style={[styles.logoTagline, { color: colors.textSecondary }]}>
            Your guide to local savings & benefits
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity
              style={styles.rowButton}
              onPress={handleThemeChange}
              accessibilityLabel="Change theme"
              accessibilityRole="button"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.buttonIcon}>{isDark ? '🌙' : '☀️'}</Text>
                <Text style={[styles.buttonText, { color: colors.primary }]}>Theme</Text>
              </View>
              <Text style={[styles.value, { color: colors.textSecondary }]}>{getThemeModeLabel()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>About</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>App Version</Text>
              <Text style={[styles.value, { color: colors.textSecondary }]}>{version}</Text>
            </View>
            {metadata && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.row}>
                  <Text style={[styles.label, { color: colors.text }]}>API Version</Text>
                  <Text style={[styles.value, { color: colors.textSecondary }]}>{metadata.version}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.row}>
                  <Text style={[styles.label, { color: colors.text }]}>Total Programs</Text>
                  <Text style={[styles.value, { color: colors.textSecondary }]}>{metadata.totalPrograms}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.row}>
                  <Text style={[styles.label, { color: colors.text }]}>Last Updated</Text>
                  <Text style={[styles.value, { color: colors.textSecondary }]}>
                    {new Date(metadata.generatedAt).toLocaleDateString()}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Storage</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>Cache Size</Text>
              <Text style={[styles.value, { color: colors.textSecondary }]}>{cacheSize}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.rowButton}
              onPress={handleClearCache}
            >
              <Text style={[styles.buttonTextDanger, { color: colors.danger }]}>Clear Cache</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Feedback</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity
              style={styles.rowButton}
              onPress={handleSendFeedback}
              accessibilityLabel="Send feedback"
              accessibilityRole="button"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.buttonIcon}>💬</Text>
                <Text style={[styles.buttonText, { color: colors.primary }]}>Send Feedback</Text>
              </View>
              <Text style={[styles.chevron, { color: colors.border }]}>›</Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.rowButton}
              onPress={handleReportIssue}
              accessibilityLabel="Report a bug or issue"
              accessibilityRole="button"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.buttonIcon}>🐛</Text>
                <Text style={[styles.buttonText, { color: colors.primary }]}>Report an Issue</Text>
              </View>
              <Text style={[styles.chevron, { color: colors.border }]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support Our Work</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.donationHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.donationTitle, { color: colors.text }]}>💚 Help Keep This App Free</Text>
              <Text style={[styles.donationDescription, { color: colors.textSecondary }]}>
                Bay Area Discounts is a volunteer-run project. Your donation helps us maintain the app and add new programs.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.donateButton, { backgroundColor: colors.success }]}
              onPress={handleDonate}
              accessibilityLabel="Donate to support Bay Area Discounts"
              accessibilityRole="button"
            >
              <Text style={styles.donateButtonText}>Donate via Website</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Links</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity
              style={styles.rowButton}
              onPress={handleOpenWebsite}
              accessibilityLabel="Visit Bay Area Discounts website"
              accessibilityRole="link"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.buttonIcon}>🌐</Text>
                <Text style={[styles.buttonText, { color: colors.primary }]}>Visit Website</Text>
              </View>
              <Text style={[styles.chevron, { color: colors.border }]}>›</Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.rowButton}
              onPress={handleOpenBayTides}
              accessibilityLabel="Visit Bay Tides parent organization website"
              accessibilityRole="link"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.buttonIcon}>🌊</Text>
                <Text style={[styles.buttonText, { color: colors.primary }]}>Bay Tides (Parent Org)</Text>
              </View>
              <Text style={[styles.chevron, { color: colors.border }]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text }]}>
            Bay Area Discounts - a Bay Tides project
          </Text>
          <Text style={[styles.footerSubtext, { color: colors.textSecondary }]}>
            Connecting residents to public benefits and community resources
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 32,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  logoTagline: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
  },
  buttonText: {
    fontSize: 16,
  },
  buttonTextDanger: {
    fontSize: 16,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  chevron: {
    fontSize: 24,
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  donationHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  donationTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  donationDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  donateButton: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  donateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
