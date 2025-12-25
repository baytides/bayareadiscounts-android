/**
 * App Navigation Structure
 * Bottom tab navigation with stack navigators for each section
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';

// Screens
import BrowseScreen from '../screens/BrowseScreen';
import SearchScreen from '../screens/SearchScreen';
import ProgramDetailScreen from '../screens/ProgramDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Type definitions for navigation
export type RootTabParamList = {
  Browse: undefined;
  Search: undefined;
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

export type SettingsStackParamList = {
  SettingsList: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const BrowseStack = createNativeStackNavigator<BrowseStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

/**
 * Browse Stack Navigator
 */
function BrowseStackNavigator() {
  const { colors } = useTheme();
  return (
    <BrowseStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
      }}
    >
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
  const { colors } = useTheme();
  return (
    <SearchStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
      }}
    >
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
 * Settings Stack Navigator
 */
function SettingsStackNavigator() {
  const { colors } = useTheme();
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
      }}
    >
      <SettingsStack.Screen
        name="SettingsList"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </SettingsStack.Navigator>
  );
}

/**
 * Main App Navigator
 */
export default function AppNavigator() {
  const { colors, isDark } = useTheme();

  const navigationTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
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
          name="Settings"
          component={SettingsStackNavigator}
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
