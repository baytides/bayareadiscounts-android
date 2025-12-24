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
  SafeAreaView,
} from 'react-native';
import APIService from '../services/api';
import { version } from '../../app.json';

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>App Version</Text>
              <Text style={styles.value}>{version}</Text>
            </View>
            {metadata && (
              <>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={styles.label}>API Version</Text>
                  <Text style={styles.value}>{metadata.version}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={styles.label}>Total Programs</Text>
                  <Text style={styles.value}>{metadata.totalPrograms}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={styles.label}>Last Updated</Text>
                  <Text style={styles.value}>
                    {new Date(metadata.generatedAt).toLocaleDateString()}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Cache Size</Text>
              <Text style={styles.value}>{cacheSize}</Text>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.rowButton}
              onPress={handleClearCache}
            >
              <Text style={styles.buttonTextDanger}>Clear Cache</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.rowButton}
              onPress={handleSendFeedback}
              accessibilityLabel="Send feedback"
              accessibilityRole="button"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.buttonIcon}>💬</Text>
                <Text style={styles.buttonText}>Send Feedback</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.rowButton}
              onPress={handleReportIssue}
              accessibilityLabel="Report a bug or issue"
              accessibilityRole="button"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.buttonIcon}>🐛</Text>
                <Text style={styles.buttonText}>Report an Issue</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.rowButton}
              onPress={handleOpenWebsite}
              accessibilityLabel="Visit Bay Area Discounts website"
              accessibilityRole="link"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.buttonIcon}>🌐</Text>
                <Text style={styles.buttonText}>Visit Website</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.rowButton}
              onPress={handleOpenBayTides}
              accessibilityLabel="Visit Bay Tides parent organization website"
              accessibilityRole="link"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.buttonIcon}>🌊</Text>
                <Text style={styles.buttonText}>Bay Tides (Parent Org)</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Bay Area Discounts - a Bay Tides project
          </Text>
          <Text style={styles.footerSubtext}>
            Connecting residents to public benefits and community resources
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#ffffff',
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
    color: '#374151',
  },
  value: {
    fontSize: 16,
    color: '#6b7280',
  },
  buttonText: {
    fontSize: 16,
    color: '#2563eb',
  },
  buttonTextDanger: {
    fontSize: 16,
    color: '#dc2626',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  chevron: {
    fontSize: 24,
    color: '#d1d5db',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginLeft: 16,
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
