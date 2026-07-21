// ============================================================================
// Main Application Entry (App.tsx)
// Wraps GestureHandlerRootView, SafeAreaProvider & AppNavigator
// ============================================================================

import React, { useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  // Inject global CSS on web to fix mobile touch issues
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        /* Fix React Native Web touch-action blocking on mobile */
        #root * {
          -webkit-tap-highlight-color: transparent;
        }
        /* Ensure all clickable elements respond to touch on mobile */
        [role="button"],
        [data-focusable="true"] {
          cursor: pointer !important;
          touch-action: manipulation !important;
          -webkit-user-select: none !important;
          user-select: none !important;
        }
        /* Fix horizontal ScrollView touch blocking on mobile */
        [data-testid*="scroll"],
        [role="list"] {
          touch-action: pan-x pan-y !important;
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="light" translucent />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
