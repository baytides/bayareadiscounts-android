/**
 * Browse Screen - Main program listing
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BrowseStackParamList } from '../navigation/AppNavigator';
import { Program, Eligibility } from '../types';
import APIService from '../services/api';
import ProgramCard from '../components/ProgramCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useTheme } from '../context/ThemeContext';

type BrowseScreenProps = {
  navigation: NativeStackNavigationProp<BrowseStackParamList, 'BrowseList'>;
};

type SortOption = 'a-z' | 'z-a' | 'recently-verified';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'a-z', label: 'A-Z' },
  { value: 'z-a', label: 'Z-A' },
  { value: 'recently-verified', label: 'Recently Verified' },
];

// Category display names and icons (mapped from actual program category values)
const CATEGORY_CONFIG: { [key: string]: { name: string; icon: string } } = {
  'community': { name: 'Community', icon: '🏘️' },
  'education': { name: 'Education', icon: '📚' },
  'equipment': { name: 'Equipment', icon: '🛠️' },
  'finance': { name: 'Finance', icon: '💰' },
  'food': { name: 'Food', icon: '🍎' },
  'health': { name: 'Health', icon: '💊' },
  'legal': { name: 'Legal', icon: '⚖️' },
  'library_resources': { name: 'Library', icon: '📖' },
  'pet_resources': { name: 'Pets', icon: '🐾' },
  'recreation': { name: 'Recreation', icon: '⚽' },
  'technology': { name: 'Technology', icon: '💻' },
  'transportation': { name: 'Transportation', icon: '🚌' },
  'utilities': { name: 'Utilities', icon: '🏠' },
};

// Bay Area counties for the "Where do I live?" filter
const BAY_AREA_COUNTIES = [
  { id: 'San Francisco', name: 'San Francisco', icon: '🌉' },
  { id: 'Alameda County', name: 'Alameda County', icon: '📍' },
  { id: 'Contra Costa County', name: 'Contra Costa', icon: '📍' },
  { id: 'Marin County', name: 'Marin County', icon: '📍' },
  { id: 'San Mateo County', name: 'San Mateo', icon: '📍' },
  { id: 'Santa Clara County', name: 'Santa Clara', icon: '📍' },
  { id: 'Solano County', name: 'Solano County', icon: '📍' },
  { id: 'Sonoma County', name: 'Sonoma County', icon: '📍' },
];

// Areas that apply to everyone (used for "None of the Above" and as additions to county selections)
const BROAD_AREAS = ['Bay Area', 'Bay Area-wide', 'Statewide', 'California', 'Nationwide'];

export default function BrowseScreen({ navigation }: BrowseScreenProps) {
  const { colors } = useTheme();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [eligibilityTypes, setEligibilityTypes] = useState<Eligibility[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedEligibility, setSelectedEligibility] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('a-z');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [programsData, eligibilityData, favoritesData] = await Promise.all([
        APIService.getPrograms(),
        APIService.getEligibility(),
        APIService.getFavorites(),
      ]);

      setPrograms(programsData);
      setEligibilityTypes(eligibilityData);
      setFavorites(favoritesData);
    } catch (err) {
      setError('Failed to load programs. Please check your connection and try again.');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Derive unique categories from programs
  const derivedCategories = useMemo(() => {
    const categorySet = new Set(programs.map(p => p.category));
    return Array.from(categorySet)
      .filter(cat => CATEGORY_CONFIG[cat])
      .sort((a, b) => (CATEGORY_CONFIG[a]?.name || a).localeCompare(CATEGORY_CONFIG[b]?.name || b));
  }, [programs]);

  const filteredPrograms = useMemo(() => {
    let filtered = programs;

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (selectedArea) {
      if (selectedArea === 'none') {
        // "None of the Above" - show only broad area programs
        filtered = filtered.filter(p =>
          p.areas.some(area => BROAD_AREAS.includes(area))
        );
      } else {
        // Specific county - show programs for that county PLUS broad area programs
        filtered = filtered.filter(p =>
          p.areas.includes(selectedArea) || p.areas.some(area => BROAD_AREAS.includes(area))
        );
      }
    }

    if (selectedEligibility.length > 0) {
      filtered = filtered.filter(p =>
        selectedEligibility.some(e => p.eligibility.includes(e))
      );
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case 'a-z':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'z-a':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'recently-verified':
        sorted.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        break;
    }

    return sorted;
  }, [programs, selectedCategory, selectedArea, selectedEligibility, sortBy]);

  const handleToggleFavorite = useCallback(async (programId: string) => {
    setFavorites(prev => {
      const next = prev.includes(programId)
        ? prev.filter(id => id !== programId)
        : [...prev, programId];
      return next;
    });

    try {
      const currentlyFav = favorites.includes(programId);
      if (currentlyFav) {
        await APIService.removeFavorite(programId);
      } else {
        await APIService.addFavorite(programId);
      }
    } catch (err) {
      setFavorites(prev => {
        const shouldBeFav = prev.includes(programId);
        return shouldBeFav ? prev.filter(id => id !== programId) : [...prev, programId];
      });
      console.error('Toggle favorite error:', err);
    }
  }, [favorites]);

  const toggleEligibility = (eligibilityId: string) => {
    setSelectedEligibility(prev => {
      if (prev.includes(eligibilityId)) {
        return prev.filter(e => e !== eligibilityId);
      } else {
        return [...prev, eligibilityId];
      }
    });
  };

  const handleSortChange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Sort By',
      'Choose how to sort programs',
      SORT_OPTIONS.map(option => ({
        text: option.label,
        onPress: () => setSortBy(option.value),
      })).concat([{ text: 'Cancel', style: 'cancel' } as any])
    );
  };

  const getSortLabel = (): string => {
    return SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'A-Z';
  };

  const renderEligibilityFilter = () => (
    <View style={[styles.filterContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Eligibility</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            { backgroundColor: colors.inputBackground },
            selectedEligibility.length === 0 && styles.filterChipActive,
          ]}
          onPress={() => setSelectedEligibility([])}
        >
          <Text style={[styles.filterText, { color: colors.text }, selectedEligibility.length === 0 && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        {eligibilityTypes.map(eligibility => (
          <TouchableOpacity
            key={eligibility.id}
            style={[
              styles.filterChip,
              { backgroundColor: colors.inputBackground },
              selectedEligibility.includes(eligibility.id) && styles.filterChipActive,
            ]}
            onPress={() => toggleEligibility(eligibility.id)}
          >
            <Text style={styles.filterIcon}>{eligibility.icon}</Text>
            <Text
              style={[
                styles.filterText,
                { color: colors.text },
                selectedEligibility.includes(eligibility.id) && styles.filterTextActive,
              ]}
            >
              {eligibility.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCategoryFilter = () => (
    <View style={[styles.filterContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            { backgroundColor: colors.inputBackground },
            !selectedCategory && styles.filterChipActive,
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.filterText, { color: colors.text }, !selectedCategory && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        {derivedCategories.map(categoryId => {
          const config = CATEGORY_CONFIG[categoryId] || { name: categoryId, icon: '📋' };
          return (
            <TouchableOpacity
              key={categoryId}
              style={[
                styles.filterChip,
                { backgroundColor: colors.inputBackground },
                selectedCategory === categoryId && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(categoryId)}
            >
              <Text style={styles.filterIcon}>{config.icon}</Text>
              <Text
                style={[
                  styles.filterText,
                  { color: colors.text },
                  selectedCategory === categoryId && styles.filterTextActive,
                ]}
              >
                {config.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderAreaFilter = () => (
    <View style={[styles.filterContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Where do you live?</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            { backgroundColor: colors.inputBackground },
            !selectedArea && styles.filterChipActive,
          ]}
          onPress={() => setSelectedArea(null)}
        >
          <Text style={[styles.filterText, { color: colors.text }, !selectedArea && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        {BAY_AREA_COUNTIES.map(county => (
          <TouchableOpacity
            key={county.id}
            style={[
              styles.filterChip,
              { backgroundColor: colors.inputBackground },
              selectedArea === county.id && styles.filterChipActive,
            ]}
            onPress={() => setSelectedArea(county.id)}
          >
            <Text style={styles.filterIcon}>{county.icon}</Text>
            <Text
              style={[
                styles.filterText,
                { color: colors.text },
                selectedArea === county.id && styles.filterTextActive,
              ]}
            >
              {county.name}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[
            styles.filterChip,
            { backgroundColor: colors.inputBackground },
            selectedArea === 'none' && styles.filterChipActive,
          ]}
          onPress={() => setSelectedArea('none')}
        >
          <Text style={styles.filterIcon}>🌐</Text>
          <Text
            style={[
              styles.filterText,
              { color: colors.text },
              selectedArea === 'none' && styles.filterTextActive,
            ]}
          >
            None of the Above
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderSortAndFilters = () => {
    const hasFilters = selectedCategory || selectedArea || selectedEligibility.length > 0;

    return (
      <View style={[styles.sortAndFiltersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.sortRow}>
          <Text style={[styles.activeFiltersText, { color: colors.textSecondary }]}>
            {hasFilters
              ? `Showing ${filteredPrograms.length} of ${programs.length} programs`
              : `${programs.length} programs`}
          </Text>
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: colors.inputBackground }]}
            onPress={handleSortChange}
            accessibilityLabel={`Sort by ${getSortLabel()}`}
            accessibilityRole="button"
          >
            <Text style={styles.sortIcon}>↕️</Text>
            <Text style={[styles.sortButtonText, { color: colors.text }]}>{getSortLabel()}</Text>
          </TouchableOpacity>
        </View>
        {hasFilters && (
          <TouchableOpacity
            onPress={() => {
              setSelectedCategory(null);
              setSelectedArea(null);
              setSelectedEligibility([]);
            }}
            style={styles.clearFiltersButton}
          >
            <Text style={[styles.clearFiltersText, { color: colors.primary }]}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading programs..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderEligibilityFilter()}
      {renderCategoryFilter()}
      {renderAreaFilter()}
      {renderSortAndFilters()}

      <FlatList
        data={filteredPrograms}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ProgramCard
            program={item}
            onPress={() => navigation.navigate('ProgramDetail', { programId: item.id })}
            isFavorite={favorites.includes(item.id)}
            onToggleFavorite={() => handleToggleFavorite(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadData}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No programs found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: 8,
    paddingTop: 12,
    borderBottomWidth: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  sortAndFiltersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sortIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  activeFiltersText: {
    fontSize: 13,
  },
  clearFiltersButton: {
    marginTop: 8,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
