/**
 * Theme constants for Bay Area Discounts
 * Centralized colors, spacing, and typography
 */

export const Colors = {
  // Primary brand colors
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#3b82f6',

  // Accent colors
  accent: '#10b981',
  accentDark: '#059669',

  // Background colors
  background: '#f9fafb',
  backgroundDark: '#111827',
  surface: '#ffffff',
  surfaceDark: '#1f2937',

  // Text colors
  text: '#111827',
  textDark: '#f9fafb',
  textSecondary: '#6b7280',
  textSecondaryDark: '#9ca3af',
  textMuted: '#9ca3af',

  // Border colors
  border: '#e5e7eb',
  borderDark: '#374151',
  borderLight: '#f3f4f6',

  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Favorites
  favorite: '#ef4444',
  favoriteInactive: '#d1d5db',

  // Category colors (for visual distinction)
  categories: {
    food: '#22c55e',
    health: '#ef4444',
    transportation: '#3b82f6',
    education: '#8b5cf6',
    recreation: '#f59e0b',
    utilities: '#06b6d4',
    technology: '#6366f1',
    finance: '#14b8a6',
    legal: '#64748b',
    community: '#ec4899',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const Typography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Category icons mapping
export const CategoryIcons: Record<string, string> = {
  food: '🍎',
  health: '💊',
  'health-wellness': '💊',
  transportation: '🚌',
  education: '📚',
  recreation: '⚽',
  utilities: '🏠',
  'housing-utilities': '🏠',
  technology: '💻',
  finance: '💰',
  legal: '⚖️',
  community: '🤝',
  equipment: '🔧',
  library_resources: '📚',
  pet_resources: '🐾',
  'arts-culture': '🎨',
  other: '📋',
};

// Eligibility icons mapping
export const EligibilityIcons: Record<string, string> = {
  'low-income': '💳',
  seniors: '👵',
  youth: '🧒',
  'college-students': '🎓',
  veterans: '🎖️',
  families: '👨‍👩‍👧',
  disability: '🧑‍🦽',
  nonprofits: '🤝',
  everyone: '🌎',
};

// API configuration
export const API = {
  baseUrl: 'https://bayareadiscounts.com/api',
  endpoints: {
    programs: '/programs.json',
    categories: '/categories.json',
    eligibility: '/eligibility.json',
    areas: '/areas.json',
    metadata: '/metadata.json',
    program: (id: string) => `/programs/${id}.json`,
  },
  timeout: 12000,
  cacheDuration: 24 * 60 * 60 * 1000, // 24 hours
};

// App configuration
export const AppConfig = {
  name: 'Bay Area Discounts',
  organization: 'Bay Tides',
  website: 'https://bayareadiscounts.com',
  organizationWebsite: 'https://baytides.org',
  issueTracker: 'https://github.com/baytides/mobile-apps/issues',
  minSearchLength: 2,
  searchDebounceMs: 500,
};
