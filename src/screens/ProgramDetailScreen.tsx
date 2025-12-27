/**
 * Program Detail Screen - Full program information
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrowseStackParamList } from '../navigation/AppNavigator';
import { Program } from '../types';
import APIService from '../services/api';
import { openExternalUrl } from '../utils/openExternal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';

type Props = NativeStackScreenProps<BrowseStackParamList, 'ProgramDetail'>;

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

export default function ProgramDetailScreen({ route, navigation }: Props) {
  const { programId } = route.params;
  const { colors } = useTheme();
  const { maxContentWidth, horizontalPadding, isTablet, width } = useResponsive();
  const [program, setProgram] = useState<Program | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgram();
  }, [programId]);

  const loadProgram = async () => {
    try {
      setLoading(true);
      setError(null);

      const [programData, favoriteStatus] = await Promise.all([
        APIService.getProgram(programId),
        APIService.isFavorite(programId),
      ]);

      setProgram(programData);
      setIsFavorite(favoriteStatus);
    } catch (err) {
      setError('Failed to load program details');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        await APIService.removeFavorite(programId);
        setIsFavorite(false);
      } else {
        await APIService.addFavorite(programId);
        setIsFavorite(true);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const handleOpenWebsite = async () => {
    if (!program?.website) return;
    await openExternalUrl(program.website, 'Cannot open this website');
  };

  const handleCall = async () => {
    if (!program?.phone) return;
    await openExternalUrl(`tel:${program.phone}`, 'Cannot place this call');
  };

  const handleEmail = async () => {
    if (!program?.email) return;
    await openExternalUrl(`mailto:${program.email}`, 'Cannot open email');
  };

  const handleShare = async () => {
    if (!program) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const shareMessage = `Check out ${program.name} on Bay Area Discounts!\n\n${program.description}\n\nLearn more: ${program.website || 'https://bayareadiscounts.com'}`;

      const result = await Share.share({
        message: shareMessage,
        title: program.name,
        ...(Platform.OS === 'ios' && program.website ? { url: program.website } : {}),
      });

      if (result.action === Share.sharedAction) {
        console.log('Shared successfully');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to share program');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading program..." />;
  }

  if (error || !program) {
    return <ErrorMessage message={error || 'Program not found'} onRetry={loadProgram} />;
  }

  const categoryIcon = CATEGORY_ICONS[program.category] || '📋';

  // Calculate centered content padding for tablets
  const contentPadding = isTablet ? Math.max((width - maxContentWidth) / 2, horizontalPadding) : 16;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingHorizontal: contentPadding }]}
    >
      <View style={[styles.contentWrapper, isTablet && { maxWidth: maxContentWidth, alignSelf: 'center', width: '100%' }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{categoryIcon}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{program.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel="Share program"
          >
            <Text style={styles.actionIcon}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Text style={styles.actionIcon}>{isFavorite ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{program.description}</Text>
      </View>

      {program.eligibility.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Eligibility</Text>
          {program.eligibility.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
              <Text style={[styles.listText, { color: colors.textSecondary }]}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {program.areas.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Service Areas</Text>
          <Text style={[styles.areaText, { color: colors.textSecondary }]}>{program.areas.join(', ')}</Text>
        </View>
      )}

      {program.cost && (
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Cost</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{program.cost}</Text>
        </View>
      )}

      {program.requirements && (
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Requirements</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{program.requirements}</Text>
        </View>
      )}

      {program.howToApply && (
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How to Apply</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{program.howToApply}</Text>
        </View>
      )}

      {program.website && (
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Official Source</Text>
          <TouchableOpacity onPress={handleOpenWebsite}>
            <Text style={[styles.sourceUrl, { color: colors.primary }]}>{program.website}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actionButtons}>
        {program.website && (
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleOpenWebsite}>
            <Text style={[styles.primaryButtonText, { color: colors.primaryText }]}>Visit Official Website</Text>
          </TouchableOpacity>
        )}

        <View style={styles.contactButtons}>
          {program.phone && (
            <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleCall}>
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>📞 Call</Text>
            </TouchableOpacity>
          )}
          {program.email && (
            <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleEmail}>
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>✉️ Email</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Last updated: {new Date(program.lastUpdated).toLocaleDateString()}
        </Text>
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    paddingVertical: 16,
  },
  contentWrapper: {
    // For tablet layouts
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    padding: 8,
  },
  actionIcon: {
    fontSize: 28,
  },
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  bodyText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bullet: {
    fontSize: 15,
    color: '#2563eb',
    marginRight: 8,
  },
  listText: {
    fontSize: 15,
    color: '#4b5563',
    flex: 1,
  },
  areaText: {
    fontSize: 15,
    color: '#4b5563',
  },
  sourceUrl: {
    fontSize: 14,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  actionButtons: {
    marginTop: 8,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#9ca3af',
  },
});
