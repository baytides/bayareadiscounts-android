/**
 * App Navigation Structure
 * Bottom tab navigation with stack navigators for each section
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import BrowseScreen from '../screens/BrowseScreen';
import SearchScreen from '../screens/SearchScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProgramDetailScreen from '../screens/ProgramDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Type definitions for navigation
export type RootTabParamList = {
  Browse: undefined;
  Search: undefined;
  Favorites: undefined;
  Settings: undefined;
};

export type BrowseStackParamList = {
  BrowseList: undefined;
  ProgramDetail: { programId: string };
};

export type SearchStackParamList = {
  SearchList: undefined;
  ProgramDetail: { programId: string };
};

export type FavoritesStackParamList = {
  FavoritesList: undefined;
  ProgramDetail: { programId: string };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const BrowseStack = createNativeStackNavigator<BrowseStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const FavoritesStack = createNativeStackNavigator<FavoritesStackParamList>();

/**
 * Browse Stack Navigator
 */
function BrowseStackNavigator() {
  return (
    <BrowseStack.Navigator>
      <BrowseStack.Screen
        name="BrowseList"
        component={BrowseScreen}
        options={{ title: 'Browse Programs' }}
      />
      <BrowseStack.Screen
        name="ProgramDetail"
        component={ProgramDetailScreen}
        options={{ title: 'Program Details' }}
      />
    </BrowseStack.Navigator>
  );
}

/**
 * Search Stack Navigator
 */
function SearchStackNavigator() {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen
        name="SearchList"
        component={SearchScreen}
        options={{ title: 'Search Programs' }}
      />
      <SearchStack.Screen
        name="ProgramDetail"
        component={ProgramDetailScreen}
        options={{ title: 'Program Details' }}
      />
    </SearchStack.Navigator>
  );
}

/**
 * Favorites Stack Navigator
 */
function FavoritesStackNavigator() {
  return (
    <FavoritesStack.Navigator>
      <FavoritesStack.Screen
        name="FavoritesList"
        component={FavoritesScreen}
        options={{ title: 'Saved Programs' }}
      />
      <FavoritesStack.Screen
        name="ProgramDetail"
        component={ProgramDetailScreen}
        options={{ title: 'Program Details' }}
      />
    </FavoritesStack.Navigator>
  );
}

/**
 * Main App Navigator
 */
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#6b7280',
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Browse"
          component={BrowseStackNavigator}
          options={{
            tabBarLabel: 'Browse',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="compass-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchStackNavigator}
          options={{
            tabBarLabel: 'Search',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Favorites"
          component={FavoritesStackNavigator}
          options={{
            tabBarLabel: 'Saved',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="star-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
