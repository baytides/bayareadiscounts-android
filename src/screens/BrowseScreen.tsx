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
import { Program, Category, Eligibility } from '../types';
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

export default function BrowseScreen({ navigation }: BrowseScreenProps) {
  const { colors } = useTheme();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [eligibilityTypes, setEligibilityTypes] = useState<Eligibility[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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

      const [programsData, categoriesData, eligibilityData, favoritesData] = await Promise.all([
        APIService.getPrograms(),
        APIService.getCategories(),
        APIService.getEligibility(),
        APIService.getFavorites(),
      ]);

      setPrograms(programsData);
      setCategories(categoriesData);
      setEligibilityTypes(eligibilityData);
      setFavorites(favoritesData);
    } catch (err) {
      setError('Failed to load programs. Please check your connection and try again.');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrograms = useMemo(() => {
    let filtered = programs;

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
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
  }, [programs, selectedCategory, selectedEligibility, sortBy]);

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

        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.filterChip,
              { backgroundColor: colors.inputBackground },
              selectedCategory === category.id && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={styles.filterIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.filterText,
                { color: colors.text },
                selectedCategory === category.id && styles.filterTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSortAndFilters = () => {
    const hasFilters = selectedCategory || selectedEligibility.length > 0;

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
