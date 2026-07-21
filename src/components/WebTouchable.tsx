// ============================================================================
// WebTouchable Component
// On iOS Safari, touch events inside ScrollView get intercepted.
// React synthetic events (onClick on div) get blocked because React delegates
// events to the root container, and ScrollView stops propagation.
//
// Solution: Use <button> HTML elements on web. Buttons have the STRONGEST
// native click handling in ALL browsers — iOS Safari processes button clicks
// at the browser engine level, before any JavaScript event interception.
// ============================================================================

import React, { useRef, useEffect } from 'react';
import { Pressable, Platform, ViewStyle } from 'react-native';

interface WebTouchableProps {
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

export const WebTouchable: React.FC<WebTouchableProps> = ({ onPress, style, children }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  // Attach click listener directly to DOM node (not through React delegation)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const btn = buttonRef.current;
    if (!btn) return;

    const handler = () => {
      onPressRef.current();
    };

    // Direct DOM listener — bypasses React's event delegation completely
    btn.addEventListener('click', handler);

    return () => {
      btn.removeEventListener('click', handler);
    };
  }, []);

  if (Platform.OS === 'web') {
    const flatStyle = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : (style || {});

    return (
      <button
        ref={buttonRef}
        type="button"
        style={{
          // Reset all button defaults
          border: 'none',
          background: 'none',
          padding: 0,
          margin: 0,
          font: 'inherit',
          color: 'inherit',
          textAlign: 'inherit' as any,
          appearance: 'none',
          WebkitAppearance: 'none',
          outline: 'none',
          // Apply component styles
          display: 'flex',
          flexDirection: 'column' as any,
          alignItems: flatStyle.alignItems || 'stretch',
          justifyContent: flatStyle.justifyContent || 'flex-start',
          width: flatStyle.width as any,
          height: flatStyle.height as any,
          borderRadius: flatStyle.borderRadius as any,
          overflow: flatStyle.overflow as any || 'visible',
          backgroundColor: flatStyle.backgroundColor || 'transparent',
          marginRight: flatStyle.marginRight as any,
          marginBottom: flatStyle.marginBottom as any,
          position: flatStyle.position as any,
          // iOS Safari specific
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
      >
        {children}
      </button>
    );
  }

  // On native: use standard Pressable
  return (
    <Pressable onPress={onPress} style={style as any}>
      {children}
    </Pressable>
  );
};

export default WebTouchable;
