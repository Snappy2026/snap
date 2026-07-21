// ============================================================================
// WebTouchable Component
// Bypass React Native Web's event system on mobile web.
// Uses native DOM addEventListener('click') directly, which works reliably
// on iOS Safari even when react-native-gesture-handler is intercepting
// touch events at the document level.
// On native platforms, falls back to Pressable.
// ============================================================================

import React, { useRef, useEffect, useCallback } from 'react';
import { View, Pressable, Platform, StyleSheet, ViewStyle } from 'react-native';

interface WebTouchableProps {
  onPress: () => void;
  style?: ViewStyle | ViewStyle[] | ((state: { pressed: boolean }) => ViewStyle | ViewStyle[]);
  children: React.ReactNode;
}

export const WebTouchable: React.FC<WebTouchableProps> = ({ onPress, style, children }) => {
  const ref = useRef<any>(null);
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = ref.current;
    if (!el) return;

    // Get the actual DOM node from the React Native Web ref
    const domNode = el._nativeTag || el;
    if (!domNode || !domNode.addEventListener) return;

    const handler = (e: Event) => {
      e.stopPropagation();
      onPressRef.current();
    };

    // Use 'click' event which fires after touchend on mobile
    domNode.addEventListener('click', handler, { passive: true });
    // Also set cursor style for visual feedback
    domNode.style.cursor = 'pointer';
    domNode.style.userSelect = 'none';
    domNode.style.webkitUserSelect = 'none';

    return () => {
      domNode.removeEventListener('click', handler);
    };
  }, []);

  if (Platform.OS === 'web') {
    const resolvedStyle = typeof style === 'function' ? style({ pressed: false }) : style;
    return (
      <View ref={ref} style={resolvedStyle as ViewStyle}>
        {children}
      </View>
    );
  }

  // On native, use Pressable
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
