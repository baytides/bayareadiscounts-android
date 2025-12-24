/**
 * API Service for Bay Area Discounts
 * Fetches data from static JSON API endpoints
 * Implements caching and offline support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Program,
  ProgramsResponse,
  CategoriesResponse,
  EligibilityResponse,
  AreasResponse,
  APIMetadata,
} from '../types';

const API_BASE_URL = 'https://bayareadiscounts.com/api';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEYS = {
  PROGRAMS: '@bay_area_discounts:programs',
  CATEGORIES: '@bay_area_discounts:categories',
  ELIGIBILITY: '@bay_area_discounts:eligibility',
  AREAS: '@bay_area_discounts:areas',
  METADATA: '@bay_area_discounts:metadata',
  FAVORITES: '@bay_area_discounts:favorites',
  RECENT_SEARCHES: '@bay_area_discounts:recent_searches',
  FILTER_PRESETS: '@bay_area_discounts:filter_presets',
};

interface CachedData<T> {
  data: T;
  timestamp: number;
}


async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, timeoutMs = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

class APIService {
  /**
   * Generic fetch with caching
   */
  private async fetchWithCache<T>(
    endpoint: string,
    cacheKey: string,
    forceRefresh: boolean = false
  ): Promise<T> {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = await this.getFromCache<T>(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Fetch from network
      const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: T = await response.json();

      // Cache the response
      await this.saveToCache(cacheKey, data);

      return data;
    } catch (error) {
      // If network fails, try to return stale cache
      const cached = await this.getFromCache<T>(cacheKey, true);
      if (cached) {
        console.warn('Using stale cache due to network error:', error);
        return cached;
      }

      throw error;
    }
  }

  /**
   * Get data from cache
   */
  private async getFromCache<T>(
    key: string,
    allowStale: boolean = false
  ): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(key);
      if (!item) return null;

      const cached: CachedData<T> = JSON.parse(item);
      const age = Date.now() - cached.timestamp;

      if (!allowStale && age > CACHE_DURATION) {
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  /**
   * Save data to cache
   */
  private async saveToCache<T>(key: string, data: T): Promise<void> {
    try {
      const cached: CachedData<T> = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(cached));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  /**
   * Fetch all programs
   */
  async getPrograms(forceRefresh: boolean = false): Promise<Program[]> {
    const response = await this.fetchWithCache<ProgramsResponse>(
      '/programs.json',
      CACHE_KEYS.PROGRAMS,
      forceRefresh
    );
    return response.programs;
  }

  /**
   * Fetch single program by ID
   */
  async getProgram(id: string): Promise<Program> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/programs/${id}.json`);

    if (!response.ok) {
      throw new Error(`Program not found: ${id}`);
    }

    return response.json();
  }

  /**
   * Fetch all categories
   */
  async getCategories(forceRefresh: boolean = false) {
    const response = await this.fetchWithCache<CategoriesResponse>(
      '/categories.json',
      CACHE_KEYS.CATEGORIES,
      forceRefresh
    );
    return response.categories;
  }

  /**
   * Fetch all eligibility types
   */
  async getEligibility(forceRefresh: boolean = false) {
    const response = await this.fetchWithCache<EligibilityResponse>(
      '/eligibility.json',
      CACHE_KEYS.ELIGIBILITY,
      forceRefresh
    );
    return response.eligibility;
  }

  /**
   * Fetch all service areas
   */
  async getAreas(forceRefresh: boolean = false) {
    const response = await this.fetchWithCache<AreasResponse>(
      '/areas.json',
      CACHE_KEYS.AREAS,
      forceRefresh
    );
    return response.areas;
  }

  /**
   * Fetch API metadata
   */
  async getMetadata(forceRefresh: boolean = false): Promise<APIMetadata> {
    return this.fetchWithCache<APIMetadata>(
      '/metadata.json',
      CACHE_KEYS.METADATA,
      forceRefresh
    );
  }

  /**
   * Search programs by query
   */
  async searchPrograms(query: string): Promise<Program[]> {
    const programs = await this.getPrograms();
    const lowerQuery = query.toLowerCase();

    return programs.filter(program =>
      program.name.toLowerCase().includes(lowerQuery) ||
      program.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Filter programs by criteria
   */
  async filterPrograms(
    categories: string[] = [],
    eligibility: string[] = [],
    areas: string[] = []
  ): Promise<Program[]> {
    const programs = await this.getPrograms();

    return programs.filter(program => {
      const categoryMatch = categories.length === 0 || categories.includes(program.category);
      const eligibilityMatch = eligibility.length === 0 ||
        eligibility.some(e => program.eligibility.includes(e));
      const areaMatch = areas.length === 0 ||
        areas.some(a => program.areas.includes(a));

      return categoryMatch && eligibilityMatch && areaMatch;
    });
  }

  /**
   * Get favorite programs
   */
  async getFavorites(): Promise<string[]> {
    try {
      const favorites = await AsyncStorage.getItem(CACHE_KEYS.FAVORITES);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Error reading favorites:', error);
      return [];
    }
  }

  /**
   * Add program to favorites
   */
  async addFavorite(programId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      if (!favorites.includes(programId)) {
        favorites.push(programId);
        await AsyncStorage.setItem(CACHE_KEYS.FAVORITES, JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }

  /**
   * Remove program from favorites
   */
  async removeFavorite(programId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const filtered = favorites.filter(id => id !== programId);
      await AsyncStorage.setItem(CACHE_KEYS.FAVORITES, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }

  /**
   * Check if program is favorited
   */
  async isFavorite(programId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.includes(programId);
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      const keys = Object.values(CACHE_KEYS).filter(key => key !== CACHE_KEYS.FAVORITES);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Get total cache size in bytes
   */
  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@bay_area_discounts:'));
      const items = await AsyncStorage.multiGet(cacheKeys);
      return items.reduce((total, item) => total + (item[1]?.length || 0), 0);
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }

  // ============================================
  // RECENT SEARCHES
  // ============================================

  private readonly MAX_RECENT_SEARCHES = 5;

  /**
   * Get recent searches
   */
  async getRecentSearches(): Promise<string[]> {
    try {
      const searches = await AsyncStorage.getItem(CACHE_KEYS.RECENT_SEARCHES);
      return searches ? JSON.parse(searches) : [];
    } catch (error) {
      console.error('Error reading recent searches:', error);
      return [];
    }
  }

  /**
   * Add a search to recent searches
   */
  async addRecentSearch(query: string): Promise<void> {
    if (!query || query.length < 2) return;

    try {
      let searches = await this.getRecentSearches();
      // Remove if already exists (case-insensitive)
      searches = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
      // Add to front
      searches.unshift(query);
      // Keep only MAX_RECENT_SEARCHES
      searches = searches.slice(0, this.MAX_RECENT_SEARCHES);
      await AsyncStorage.setItem(CACHE_KEYS.RECENT_SEARCHES, JSON.stringify(searches));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  }

  /**
   * Clear recent searches
   */
  async clearRecentSearches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEYS.RECENT_SEARCHES);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  }

  // ============================================
  // FILTER PRESETS
  // ============================================

  private readonly MAX_PRESETS = 10;

  /**
   * Get all filter presets
   */
  async getFilterPresets(): Promise<FilterPreset[]> {
    try {
      const presets = await AsyncStorage.getItem(CACHE_KEYS.FILTER_PRESETS);
      return presets ? JSON.parse(presets) : [];
    } catch (error) {
      console.error('Error reading filter presets:', error);
      return [];
    }
  }

  /**
   * Save a new filter preset
   */
  async saveFilterPreset(name: string, filters: FilterPreset['filters']): Promise<FilterPreset | null> {
    if (!name || !name.trim()) return null;

    try {
      let presets = await this.getFilterPresets();

      if (presets.length >= this.MAX_PRESETS) {
        console.warn('Maximum presets reached');
        return null;
      }

      const preset: FilterPreset = {
        id: Date.now().toString(),
        name: name.trim(),
        filters,
        createdAt: new Date().toISOString(),
      };

      presets.unshift(preset);
      await AsyncStorage.setItem(CACHE_KEYS.FILTER_PRESETS, JSON.stringify(presets));
      return preset;
    } catch (error) {
      console.error('Error saving filter preset:', error);
      return null;
    }
  }

  /**
   * Delete a filter preset
   */
  async deleteFilterPreset(id: string): Promise<void> {
    try {
      let presets = await this.getFilterPresets();
      presets = presets.filter(p => p.id !== id);
      await AsyncStorage.setItem(CACHE_KEYS.FILTER_PRESETS, JSON.stringify(presets));
    } catch (error) {
      console.error('Error deleting filter preset:', error);
    }
  }
}

// Type for filter presets (exported for use in components)
export interface FilterPreset {
  id: string;
  name: string;
  filters: {
    categories: string[];
    eligibility: string[];
    areas: string[];
    searchQuery: string;
  };
  createdAt: string;
}

export default new APIService();
