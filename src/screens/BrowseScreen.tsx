/**
 * Browse Screen - Main program listing
 */

import React, { useEffect, useMemo, useState, useCallback, useLayoutEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

type SortOption = 'name-asc' | 'name-desc' | 'area-asc' | 'area-desc' | 'category-asc' | 'category-desc' | 'recently-verified';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'area-asc', label: 'Area (A-Z)' },
  { value: 'area-desc', label: 'Area (Z-A)' },
  { value: 'category-asc', label: 'Category (A-Z)' },
  { value: 'category-desc', label: 'Category (Z-A)' },
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
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Add saved toggle button to header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowSavedOnly(prev => !prev);
          }}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel={showSavedOnly ? 'Show all programs' : 'Show saved programs only'}
          accessibilityState={{ selected: showSavedOnly }}
        >
          <Ionicons
            name={showSavedOnly ? 'star' : 'star-outline'}
            size={24}
            color={showSavedOnly ? '#f59e0b' : colors.text}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, showSavedOnly, colors.text]);

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

    // Filter to saved only if toggle is active
    if (showSavedOnly) {
      filtered = filtered.filter(p => favorites.includes(p.id));
    }

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
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'area-asc':
        sorted.sort((a, b) => {
          const aArea = a.city || a.areas[0] || '';
          const bArea = b.city || b.areas[0] || '';
          return aArea.localeCompare(bArea);
        });
        break;
      case 'area-desc':
        sorted.sort((a, b) => {
          const aArea = a.city || a.areas[0] || '';
          const bArea = b.city || b.areas[0] || '';
          return bArea.localeCompare(aArea);
        });
        break;
      case 'category-asc':
        sorted.sort((a, b) => {
          const aName = CATEGORY_CONFIG[a.category]?.name || a.category;
          const bName = CATEGORY_CONFIG[b.category]?.name || b.category;
          return aName.localeCompare(bName);
        });
        break;
      case 'category-desc':
        sorted.sort((a, b) => {
          const aName = CATEGORY_CONFIG[a.category]?.name || a.category;
          const bName = CATEGORY_CONFIG[b.category]?.name || b.category;
          return bName.localeCompare(aName);
        });
        break;
      case 'recently-verified':
        sorted.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        break;
    }

    return sorted;
  }, [programs, selectedCategory, selectedArea, selectedEligibility, sortBy, showSavedOnly, favorites]);

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
    return SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Name (A-Z)';
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
          accessibilityRole="button"
          accessibilityLabel="All eligibility types"
          accessibilityState={{ selected: selectedEligibility.length === 0 }}
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
            accessibilityRole="button"
            accessibilityLabel={`${eligibility.name} eligibility`}
            accessibilityState={{ selected: selectedEligibility.includes(eligibility.id) }}
          >
            <Text style={styles.filterIcon} accessible={false}>{eligibility.icon}</Text>
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
          accessibilityRole="button"
          accessibilityLabel="All categories"
          accessibilityState={{ selected: !selectedCategory }}
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
              onPress={() => setSelectedCategory(prev => prev === categoryId ? null : categoryId)}
              accessibilityRole="button"
              accessibilityLabel={`${config.name} category`}
              accessibilityState={{ selected: selectedCategory === categoryId }}
            >
              <Text style={styles.filterIcon} accessible={false}>{config.icon}</Text>
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
          accessibilityRole="button"
          accessibilityLabel="All areas"
          accessibilityState={{ selected: !selectedArea }}
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
            onPress={() => setSelectedArea(prev => prev === county.id ? null : county.id)}
            accessibilityRole="button"
            accessibilityLabel={`${county.name} area`}
            accessibilityState={{ selected: selectedArea === county.id }}
          >
            <Text style={styles.filterIcon} accessible={false}>{county.icon}</Text>
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
          onPress={() => setSelectedArea(prev => prev === 'none' ? null : 'none')}
          accessibilityRole="button"
          accessibilityLabel="Other - show broad area programs only"
          accessibilityState={{ selected: selectedArea === 'none' }}
        >
          <Text style={styles.filterIcon} accessible={false}>🌐</Text>
          <Text
            style={[
              styles.filterText,
              { color: colors.text },
              selectedArea === 'none' && styles.filterTextActive,
            ]}
          >
            Other
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderSortAndFilters = () => {
    const hasFilters = selectedCategory || selectedArea || selectedEligibility.length > 0 || showSavedOnly;

    return (
      <View style={[styles.sortAndFiltersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.sortRow}>
          <Text style={[styles.activeFiltersText, { color: colors.textSecondary }]}>
            {showSavedOnly
              ? `${filteredPrograms.length} saved program${filteredPrograms.length !== 1 ? 's' : ''}`
              : hasFilters
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
              setShowSavedOnly(false);
            }}
            style={styles.clearFiltersButton}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            accessibilityHint="Double-tap to remove all active filters"
          >
            <Text style={[styles.clearFiltersText, { color: colors.primary }]}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderListHeader = () => (
    <View>
      {renderEligibilityFilter()}
      {renderCategoryFilter()}
      {renderAreaFilter()}
      {renderSortAndFilters()}
    </View>
  );

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading programs..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
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
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadData}
        onScrollToIndexFailed={() => {}}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {showSavedOnly ? (
              <>
                <Ionicons name="star-outline" size={48} color={colors.textSecondary} style={styles.emptyIcon} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No saved programs yet</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Tap the star on any program to save it
                </Text>
              </>
            ) : (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No programs found</Text>
            )}
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
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
