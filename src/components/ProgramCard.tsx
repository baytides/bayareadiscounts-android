/**
 * Program Card Component
 * Displays program summary in a card format
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Program } from '../types';
import { useTheme } from '../context/ThemeContext';

// Helper to safely trigger haptics (respects reduce motion)
const triggerHaptic = async () => {
  const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
  if (!isReduceMotionEnabled) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

interface ProgramCardProps {
  program: Program;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isTablet?: boolean;
}

const CATEGORY_ICONS: { [key: string]: string } = {
  'arts-culture': '🎨',
  'education': '📚',
  'food': '🍎',
  'health-wellness': '💊',
  'housing-utilities': '🏠',
  'recreation': '⚽',
  'transportation': '🚌',
  'other': '📋',
};

// Format eligibility tag to Title Case
const formatEligibilityTag = (tag: string): string => {
  return tag
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

function ProgramCard({
  program,
  onPress,
  isFavorite = false,
  onToggleFavorite,
  isTablet = false,
}: ProgramCardProps) {
  const { colors, isDark } = useTheme();
  const categoryIcon = CATEGORY_ICONS[program.category] || '📋';
  // Display city if available, otherwise fall back to areas (county)
  const areaText = program.city || program.areas.join(', ');

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.cardBackground },
        // For tablet multi-column layout, remove horizontal margin since wrapper handles it
        isTablet && styles.cardTablet,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${program.name}. ${program.description}`}
      accessibilityHint="Double-tap to view full program details"
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon} accessible={false}>{categoryIcon}</Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2} allowFontScaling={true} maxFontSizeMultiplier={1.5}>
            {program.name}
          </Text>
        </View>
        {onToggleFavorite && (
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              onToggleFavorite();
            }}
            style={styles.favoriteButton}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            accessibilityState={{ checked: isFavorite }}
            accessibilityHint={isFavorite ? 'Double-tap to remove this program from your saved list' : 'Double-tap to save this program'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.favoriteIcon} accessible={false}>{isFavorite ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3} allowFontScaling={true} maxFontSizeMultiplier={1.5}>
        {program.description}
      </Text>

      {program.eligibility.length > 0 && (
        <View style={styles.eligibilityContainer}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Eligibility:</Text>
          <View style={styles.tags}>
            {program.eligibility.slice(0, 2).map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: isDark ? '#1e3a5f' : '#dbeafe' }]}>
                <Text style={[styles.tagText, { color: isDark ? '#93c5fd' : '#1e40af' }]}>{formatEligibilityTag(tag)}</Text>
              </View>
            ))}
            {program.eligibility.length > 2 && (
              <Text style={[styles.moreText, { color: colors.textSecondary }]}>+{program.eligibility.length - 2} more</Text>
            )}
          </View>
        </View>
      )}

      {areaText && (
        <View style={styles.areaContainer}>
          <Text style={styles.areaIcon}>📍</Text>
          <Text style={[styles.areaText, { color: colors.textSecondary }]} numberOfLines={1}>
            {areaText}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTablet: {
    marginHorizontal: 0,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  favoriteButton: {
    padding: 8,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 24,
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  eligibilityContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#1e40af',
  },
  moreText: {
    fontSize: 12,
    color: '#6b7280',
    alignSelf: 'center',
  },
  areaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  areaIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  areaText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
});

export default memo(ProgramCard);
