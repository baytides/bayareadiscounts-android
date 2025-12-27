/**
 * Responsive utilities for tablet support
 */

import { useWindowDimensions } from 'react-native';

// Breakpoints (in dp)
const BREAKPOINTS = {
  phone: 0,
  tablet: 600,
  largeTablet: 900,
} as const;

export type DeviceType = 'phone' | 'tablet' | 'largeTablet';

interface ResponsiveInfo {
  width: number;
  height: number;
  isTablet: boolean;
  isLargeTablet: boolean;
  isLandscape: boolean;
  deviceType: DeviceType;
  // Number of columns for grid layouts
  gridColumns: number;
  // Horizontal padding that scales with screen size
  horizontalPadding: number;
  // Max content width for readability
  maxContentWidth: number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const isTablet = width >= BREAKPOINTS.tablet;
  const isLargeTablet = width >= BREAKPOINTS.largeTablet;

  let deviceType: DeviceType = 'phone';
  if (isLargeTablet) {
    deviceType = 'largeTablet';
  } else if (isTablet) {
    deviceType = 'tablet';
  }

  // Determine grid columns based on screen width
  let gridColumns = 1;
  if (isLargeTablet) {
    gridColumns = 3;
  } else if (isTablet) {
    gridColumns = 2;
  }

  // Scale horizontal padding with screen size
  let horizontalPadding = 16;
  if (isLargeTablet) {
    horizontalPadding = 32;
  } else if (isTablet) {
    horizontalPadding = 24;
  }

  // Max content width for readability (prevents text from stretching too wide)
  const maxContentWidth = isTablet ? 800 : width;

  return {
    width,
    height,
    isTablet,
    isLargeTablet,
    isLandscape,
    deviceType,
    gridColumns,
    horizontalPadding,
    maxContentWidth,
  };
}

// Helper to get responsive value based on device type
export function getResponsiveValue<T>(
  deviceType: DeviceType,
  values: { phone: T; tablet?: T; largeTablet?: T }
): T {
  if (deviceType === 'largeTablet' && values.largeTablet !== undefined) {
    return values.largeTablet;
  }
  if ((deviceType === 'tablet' || deviceType === 'largeTablet') && values.tablet !== undefined) {
    return values.tablet;
  }
  return values.phone;
}
