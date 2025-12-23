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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SearchStackParamList } from '../navigation/AppNavigator';
import { Program } from '../types';
import APIService from '../services/api';
import ProgramCard from '../components/ProgramCard';
import LoadingSpinner from '../components/LoadingSpinner';

type SearchScreenProps = {
  navigation: NativeStackNavigationProp<SearchStackParamList, 'SearchList'>;
};

export default function SearchScreen({ navigation }: SearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const favs = await APIService.getFavorites();
      setFavorites(favs);
    } catch (err) {
      console.error('Load favorites error:', err);
    }
  };

  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) return;

    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      const results = await APIService.searchPrograms(query);

      // Only apply if this is still the latest request
      if (requestId === requestIdRef.current) {
        setPrograms(results);
        setSearched(true);
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

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search programs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Text style={styles.clearIcon}>✕</Text>
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
              <Text style={styles.emptyText}>No programs found</Text>
              <Text style={styles.emptySubtext}>Try different keywords</Text>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>Search for programs</Text>
          <Text style={styles.emptySubtext}>
            Enter at least 2 characters to search
          </Text>
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
});
