/**
 * Search Screen - Search and filter programs
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SearchStackParamList } from '../navigation/AppNavigator';
import { Program } from '../types';
import APIService from '../services/api';
import ProgramCard from '../components/ProgramCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../context/ThemeContext';

type SearchScreenProps = {
  navigation: NativeStackNavigationProp<SearchStackParamList, 'SearchList'>;
};

export default function SearchScreen({ navigation }: SearchScreenProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    loadFavorites();
    loadRecentSearches();
  }, []);

  // Reload recent searches when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRecentSearches();
    }, [])
  );

  const loadRecentSearches = async () => {
    try {
      const searches = await APIService.getRecentSearches();
      setRecentSearches(searches);
    } catch (err) {
      console.error('Load recent searches error:', err);
    }
  };

  const loadFavorites = async () => {
    try {
      const favs = await APIService.getFavorites();
      setFavorites(favs);
    } catch (err) {
      console.error('Load favorites error:', err);
    }
  };

  const performSearch = useCallback(async (query: string, saveToRecent: boolean = true) => {
    if (query.length < 2) return;

    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      const results = await APIService.searchPrograms(query);

      // Only apply if this is still the latest request
      if (requestId === requestIdRef.current) {
        setPrograms(results);
        setSearched(true);

        // Save to recent searches if we got results
        if (saveToRecent && results.length > 0) {
          await APIService.addRecentSearch(query);
          loadRecentSearches();
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    const debounceTimer = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        setPrograms([]);
        setSearched(false);
      }
    }, 500); // Debounce search for 500ms

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, performSearch]);

  const handleSearch = useCallback(() => {
    performSearch(searchQuery.trim());
  }, [searchQuery, performSearch]);


  const handleToggleFavorite = async (programId: string) => {
    try {
      if (favorites.includes(programId)) {
        await APIService.removeFavorite(programId);
        setFavorites(favorites.filter(id => id !== programId));
      } else {
        await APIService.addFavorite(programId);
        setFavorites([...favorites, programId]);
      }
    } catch (err) {
      console.error('Toggle favorite error:', err);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setPrograms([]);
    setSearched(false);
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
    performSearch(query, false); // Don't save again since it's already in recent
  };

  const handleClearRecentSearches = async () => {
    await APIService.clearRecentSearches();
    setRecentSearches([]);
  };

  const renderRecentSearches = () => {
    if (recentSearches.length === 0) return null;

    return (
      <View style={[styles.recentSearchesContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.recentSearchesHeader}>
          <Text style={[styles.recentSearchesTitle, { color: colors.text }]}>Recent Searches</Text>
          <TouchableOpacity
            onPress={handleClearRecentSearches}
            accessibilityLabel="Clear recent searches"
            accessibilityRole="button"
          >
            <Text style={[styles.clearRecentText, { color: colors.primary }]}>Clear</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentSearchesList}
        >
          {recentSearches.map((search, index) => (
            <TouchableOpacity
              key={`${search}-${index}`}
              style={[styles.recentSearchChip, { backgroundColor: colors.inputBackground }]}
              onPress={() => handleRecentSearchPress(search)}
              accessibilityLabel={`Search for ${search}`}
              accessibilityRole="button"
            >
              <Text style={styles.recentSearchChipIcon}>🕐</Text>
              <Text style={[styles.recentSearchChipText, { color: colors.text }]}>{search}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.inputBackground }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search programs..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Text style={[styles.clearIcon, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <LoadingSpinner message="Searching..." />
      ) : searched ? (
        <FlatList
          data={programs}
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
          onRefresh={handleSearch}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No programs found</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Try different keywords</Text>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          {renderRecentSearches()}
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>Search for programs</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Enter at least 2 characters to search
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 20,
    color: '#6b7280',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyStateContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Recent Searches styles
  recentSearchesContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  recentSearchesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  clearRecentText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  recentSearchesList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  recentSearchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  recentSearchChipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  recentSearchChipText: {
    fontSize: 14,
    color: '#374151',
  },
});
