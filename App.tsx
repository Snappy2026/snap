// ============================================================================
// Main Application Entry (App.tsx)
// On native: wraps GestureHandlerRootView, SafeAreaProvider & AppNavigator
// On web: skips GestureHandlerRootView to prevent touch event blocking on iOS Safari
// ============================================================================

import React, { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';

// Only import GestureHandlerRootView on native — it blocks touch events on iOS Safari
let GestureHandlerRootView: React.ComponentType<any> | null = null;
if (Platform.OS !== 'web') {
  GestureHandlerRootView = require('react-native-gesture-handler').GestureHandlerRootView;
}

export default function App() {
  // Inject global CSS on web to fix mobile touch issues
  useEffect(() => {
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = "ClubD";
      
      const setMeta = (name, content) => {
        let el = document.querySelector(`meta[name="${name}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute('name', name);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      setMeta("apple-mobile-web-app-title", "ClubD");
      setMeta("application-name", "ClubD");
      setMeta("apple-mobile-web-app-capable", "yes");
      setMeta("apple-mobile-web-app-status-bar-style", "black-translucent");

      let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
      if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.setAttribute('rel', 'apple-touch-icon');
        document.head.appendChild(appleIcon);
      }
      appleIcon.setAttribute('href', '/assets/icon.png');
      const style = document.createElement('style');
      style.textContent = `
                html, body, #root {
          height: 100%;
          min-height: 100vh;
          overflow: hidden;
          background-color: #000;
        }
                html, body, #root {
          height: 100%;
          min-height: 100vh;
          min-height: -webkit-fill-available;
          overflow: hidden;
          background-color: #000;
        }
        /* Lock root container to viewport on mobile web */
        #root > div {
          height: 100vh !important;
          height: -webkit-fill-available !important;
        }
        /* Fix React Native Web touch-action blocking on mobile Safari */
        #root div[style*="touch-action"] {
          touch-action: auto !important;
        }
        /* Ensure all interactive elements respond to touch on mobile */
        [role="button"] {
          cursor: pointer !important;
          touch-action: manipulation !important;
        }
        /* Ensure ScrollViews allow both pan directions */
        [data-testid*="scroll"],
        [role="list"] {
          touch-action: pan-x pan-y !important;
        }
        /* Remove iOS tap highlight */
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  // On web: use plain View wrapper (no gesture handler intercepting touches)
  // On native: use GestureHandlerRootView for gesture support
  const RootWrapper = Platform.OS === 'web' || !GestureHandlerRootView
    ? View
    : GestureHandlerRootView;

  return (
    <RootWrapper style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="light" translucent />
        <AppNavigator />
      </SafeAreaProvider>
    </RootWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
