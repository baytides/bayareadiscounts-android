/**
 * Favorites Screen - Saved programs
 */

import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { FavoritesStackParamList } from '../navigation/AppNavigator';
import { Program } from '../types';
import APIService from '../services/api';
import ProgramCard from '../components/ProgramCard';
import LoadingSpinner from '../components/LoadingSpinner';

type FavoritesScreenProps = {
  navigation: NativeStackNavigationProp<FavoritesStackParamList, 'FavoritesList'>;
};

export default function FavoritesScreen({ navigation }: FavoritesScreenProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Reload favorites when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      setLoading(true);

      const [favoriteIds, allPrograms] = await Promise.all([
        APIService.getFavorites(),
        APIService.getPrograms(),
      ]);

      setFavorites(favoriteIds);

      // Filter programs to only show favorites
      const favoritePrograms = allPrograms.filter(p => favoriteIds.includes(p.id));
      setPrograms(favoritePrograms);
    } catch (err) {
      console.error('Load favorites error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (programId: string) => {
    try {
      await APIService.removeFavorite(programId);
      setFavorites(favorites.filter(id => id !== programId));
      setPrograms(programs.filter(p => p.id !== programId));
    } catch (err) {
      console.error('Remove favorite error:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading saved programs..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={programs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ProgramCard
            program={item}
            onPress={() => navigation.navigate('ProgramDetail', { programId: item.id })}
            isFavorite={true}
            onToggleFavorite={() => handleToggleFavorite(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadFavorites}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyText}>No saved programs yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the star icon on any program to save it here
            </Text>
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
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
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
