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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BrowseStackParamList } from '../navigation/AppNavigator';
import { Program, Category } from '../types';
import APIService from '../services/api';
import ProgramCard from '../components/ProgramCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

type BrowseScreenProps = {
  navigation: NativeStackNavigationProp<BrowseStackParamList, 'BrowseList'>;
};

export default function BrowseScreen({ navigation }: BrowseScreenProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [programsData, categoriesData, favoritesData] = await Promise.all([
        APIService.getPrograms(),
        APIService.getCategories(),
        APIService.getFavorites(),
      ]);

      setPrograms(programsData);
      setCategories(categoriesData);
      setFavorites(favoritesData);
    } catch (err) {
      setError('Failed to load programs. Please check your connection and try again.');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrograms = useMemo(() => {
    if (!selectedCategory) return programs;
    return programs.filter(p => p.category === selectedCategory);
  }, [programs, selectedCategory]);

  const handleToggleFavorite = useCallback(async (programId: string) => {
    // Optimistic update with safe functional state updates
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
      // Revert on failure
      setFavorites(prev => {
        const shouldBeFav = prev.includes(programId);
        return shouldBeFav ? prev.filter(id => id !== programId) : [...prev, programId];
      });
      console.error('Toggle favorite error:', err);
    }
  }, [favorites]);


  const renderCategoryFilter = () => (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <TouchableOpacity
          style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.filterText, !selectedCategory && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.filterChip,
              selectedCategory === category.id && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={styles.filterIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.filterText,
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

  if (loading) {
    return <LoadingSpinner message="Loading programs..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  return (
    <View style={styles.container}>
      {renderCategoryFilter()}

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
            <Text style={styles.emptyText}>No programs found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
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
    color: '#374151',
  },
  filterTextActive: {
    color: '#ffffff',
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
    color: '#6b7280',
  },
});
