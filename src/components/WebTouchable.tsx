// ============================================================================
// WebTouchable Component
// On web: renders a raw HTML <div> with React onClick — the most basic,
// guaranteed-to-work click handler on any browser including iOS Safari.
// Completely bypasses React Native Web's View, Pressable, TouchableOpacity.
// On native: uses standard Pressable.
// ============================================================================

import React from 'react';
import { Pressable, Platform, ViewStyle } from 'react-native';

interface WebTouchableProps {
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

export const WebTouchable: React.FC<WebTouchableProps> = ({ onPress, style, children }) => {
  if (Platform.OS === 'web') {
    // On web: use a raw HTML <div> with onClick
    // This is the most reliable way to handle taps on iOS Safari
    const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : (style || {});

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onPress();
        }}
        onTouchEnd={(e) => {
          // Also handle touchend for maximum mobile compatibility
          e.stopPropagation();
          e.preventDefault();
          onPress();
        }}
        style={{
          ...flatStyle,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'manipulation',
        } as React.CSSProperties}
      >
        {children}
      </div>
    );
  }

  // On native: use standard Pressable
  return (
    <Pressable
      onPress={onPress}
      style={style as any}
    >
      {children}
    </Pressable>
  );
};

export default WebTouchable;
