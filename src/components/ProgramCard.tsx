/**
 * Program Card Component
 * Displays program summary in a card format
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Program } from '../types';

interface ProgramCardProps {
  program: Program;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
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

function ProgramCard({
  program,
  onPress,
  isFavorite = false,
  onToggleFavorite,
}: ProgramCardProps) {
  const categoryIcon = CATEGORY_ICONS[program.category] || '📋';
  const areaText = program.areas.join(', ');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${program.name}. ${program.description}`}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{categoryIcon}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {program.name}
          </Text>
        </View>
        {onToggleFavorite && (
          <TouchableOpacity
            onPress={onToggleFavorite}
            style={styles.favoriteButton}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Text style={styles.favoriteIcon}>{isFavorite ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {program.description}
      </Text>

      {program.eligibility.length > 0 && (
        <View style={styles.eligibilityContainer}>
          <Text style={styles.label}>Eligibility:</Text>
          <View style={styles.tags}>
            {program.eligibility.slice(0, 2).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {program.eligibility.length > 2 && (
              <Text style={styles.moreText}>+{program.eligibility.length - 2} more</Text>
            )}
          </View>
        </View>
      )}

      {areaText && (
        <View style={styles.areaContainer}>
          <Text style={styles.areaIcon}>📍</Text>
          <Text style={styles.areaText} numberOfLines={1}>
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
    padding: 4,
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
