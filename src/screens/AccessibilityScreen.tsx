/**
 * Accessibility Screen
 * Shows accessibility settings and information
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
  AccessibilityInfo,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';

export default function AccessibilityScreen() {
  const { colors } = useTheme();
  const { maxContentWidth, horizontalPadding, isTablet, width } = useResponsive();
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState<boolean>(false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState<boolean>(false);

  useEffect(() => {
    checkAccessibilitySettings();
  }, []);

  const checkAccessibilitySettings = async () => {
    try {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      const screenReader = await AccessibilityInfo.isScreenReaderEnabled();
      setReduceMotionEnabled(reduceMotion);
      setScreenReaderEnabled(screenReader);
    } catch (err) {
      console.error('Error checking accessibility settings:', err);
    }

    // Listen for changes
    const reduceMotionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => setReduceMotionEnabled(enabled)
    );
    const screenReaderSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled) => setScreenReaderEnabled(enabled)
    );

    return () => {
      reduceMotionSubscription?.remove();
      screenReaderSubscription?.remove();
    };
  };

  const handleOpenAccessibilitySettings = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (Platform.OS === 'android') {
        await Linking.openSettings();
      } else {
        await Linking.openURL('app-settings:');
      }
    } catch (err) {
      Alert.alert(
        'Cannot Open Settings',
        'Please open your device Settings app and navigate to Accessibility.',
        [{ text: 'OK' }]
      );
    }
  };

  // Calculate centered content padding for tablets
  const contentPadding = isTablet ? Math.max((width - maxContentWidth) / 2, horizontalPadding) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: contentPadding }}>
        <View style={[styles.contentWrapper, isTablet && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Status</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.row}>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Screen Reader</Text>
                <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
                  {screenReaderEnabled ? 'TalkBack is active' : 'Not active'}
                </Text>
              </View>
              <Text style={[styles.statusIndicator, { color: screenReaderEnabled ? colors.success : colors.textSecondary }]}>
                {screenReaderEnabled ? '●' : '○'}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.row}>
              <View style={styles.rowTextContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Reduce Motion</Text>
                <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
                  {reduceMotionEnabled ? 'Animations reduced' : 'Animations enabled'}
                </Text>
              </View>
              <Text style={[styles.statusIndicator, { color: reduceMotionEnabled ? colors.success : colors.textSecondary }]}>
                {reduceMotionEnabled ? '●' : '○'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Supported Features</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.featureRow}>
              <Text style={styles.featureIcon}>🔊</Text>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>Screen Reader (TalkBack)</Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  All elements are properly labeled for screen readers to provide audio feedback.
                </Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.featureRow}>
              <Text style={styles.featureIcon}>✨</Text>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>Reduce Motion</Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Animations are disabled when this setting is enabled in your device settings.
                </Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.featureRow}>
              <Text style={styles.featureIcon}>🔤</Text>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>Font Scaling</Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Text sizes respect your device's font size preferences (up to 1.5x).
                </Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.featureRow}>
              <Text style={styles.featureIcon}>🌙</Text>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Reduces eye strain in low-light conditions with a dark color scheme.
                </Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.featureRow}>
              <Text style={styles.featureIcon}>🎨</Text>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>High Contrast</Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Compatible with system high contrast modes for better visibility.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Device Settings</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity
              style={styles.rowButton}
              onPress={handleOpenAccessibilitySettings}
              accessibilityLabel="Open device accessibility settings"
              accessibilityRole="button"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.buttonIcon}>⚙️</Text>
                <Text style={[styles.buttonText, { color: colors.primary }]}>Open Accessibility Settings</Text>
              </View>
              <Text style={[styles.chevron, { color: colors.border }]}>›</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            To enable or disable accessibility features, open your device's Settings app and navigate to Accessibility.
          </Text>
        </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    // For tablet layouts
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
  rowTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
  },
  sublabel: {
    fontSize: 13,
    marginTop: 2,
  },
  statusIndicator: {
    fontSize: 16,
    fontWeight: '600',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 24,
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
  helpText: {
    fontSize: 13,
    marginTop: 8,
    paddingHorizontal: 4,
    lineHeight: 18,
  },
});
