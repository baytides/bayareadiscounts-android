/**
 * Loading Spinner Component
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <View style={styles.container} accessible={true} accessibilityRole="progressbar" accessibilityLabel={message} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color="#2563eb" accessibilityElementsHidden={true} />
      {message && <Text style={styles.message} allowFontScaling={true} maxFontSizeMultiplier={1.5}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
});
