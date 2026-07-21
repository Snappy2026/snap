// ============================================================================
// StoryViewerModal Component
// On Web: renders a pure HTML full-screen overlay via createPortal.
// Uses only native HTML elements (div, img, button) - NO React Native Web
// components inside the portal, to avoid iOS Safari touch blocking.
// On Native: uses React Native <Modal> with RN components.
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  Pressable,
  Dimensions,
  SafeAreaView,
  Modal,
  Platform,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

// Web-only: import createPortal
let createPortal: any = null;
if (Platform.OS === 'web') {
  try {
    createPortal = require('react-dom').createPortal;
  } catch (e) {}
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export interface StoryViewerItem {
  id: string;
  media_url: string;
  media_type?: 'image' | 'video' | string;
  user_profile?: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

interface StoryViewerModalProps {
  visible: boolean;
  stories: StoryViewerItem[];
  initialIndex?: number;
  onClose: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  visible,
  stories,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      progress.value = 0;
    } else {
      cancelAnimation(progress);
    }
  }, [visible, initialIndex]);

  const fallbackStory: StoryViewerItem = {
    id: 'demo-story',
    media_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    media_type: 'image',
    user_profile: { display_name: 'Snapchat Story' },
  };

  const activeStories = stories && stories.length > 0 ? stories : [fallbackStory];
  const currentStory = activeStories[currentIndex] || activeStories[0] || fallbackStory;

  const handleClose = useCallback(() => {
    cancelAnimation(progress);
    onClose();
  }, [onClose]);

  const advanceStory = useCallback(() => {
    if (currentIndex < activeStories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      progress.value = 0;
    } else {
      handleClose();
    }
  }, [currentIndex, activeStories.length, handleClose]);

  const previousStory = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      progress.value = 0;
    }
  }, [currentIndex]);

  // Auto-advance timer
  useEffect(() => {
    if (!visible) return;
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: 5000, easing: Easing.linear },
      (finished?: boolean) => {
        if (finished) {
          runOnJS(advanceStory)();
        }
      }
    );
    return () => {
      cancelAnimation(progress);
    };
  }, [currentIndex, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (!visible) return null;

  // ══════════════════════════════════════════════════════════════
  // WEB: Pure HTML rendering via createPortal
  // No React Native Web components inside the portal — only native
  // HTML elements to avoid iOS Safari touch blocking.
  // ══════════════════════════════════════════════════════════════
  if (Platform.OS === 'web') {
    const webOverlay = (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000',
          zIndex: 9999999,
          display: 'flex',
          flexDirection: 'column' as any,
        }}
      >
        {/* Background Media */}
        {currentStory.media_type === 'video' ? (
          <video
            src={currentStory.media_url}
            autoPlay
            playsInline
            muted={false}
            loop={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        ) : (
          <img
            src={currentStory.media_url}
            alt="Story"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        )}

        {/* Touch zones: left = previous, right = next */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'row' as any,
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={previousStory}
            style={{
              flex: 1,
              height: '100%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              WebkitAppearance: 'none' as any,
              appearance: 'none' as any,
              touchAction: 'manipulation',
              padding: 0,
            }}
            aria-label="Previous story"
          />
          <button
            type="button"
            onClick={advanceStory}
            style={{
              flex: 2,
              height: '100%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              WebkitAppearance: 'none' as any,
              appearance: 'none' as any,
              touchAction: 'manipulation',
              padding: 0,
            }}
            aria-label="Next story"
          />
        </div>

        {/* Top bar: progress + author + close */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            padding: '12px 16px',
            paddingTop: 'max(12px, env(safe-area-inset-top))',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
          }}
        >
          {/* Progress segments */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
            {activeStories.map((s, idx) => (
              <div
                key={s.id || idx}
                style={{
                  flex: 1,
                  height: '3px',
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    backgroundColor: '#FFF',
                    borderRadius: '2px',
                    width: idx < currentIndex ? '100%' : idx === currentIndex ? '50%' : '0%',
                    transition: idx === currentIndex ? 'width 5s linear' : 'none',
                    ...(idx === currentIndex && visible ? { width: '100%' } : {}),
                  }}
                />
              </div>
            ))}
          </div>

          {/* Author + close */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row' as any,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row' as any, alignItems: 'center', gap: '8px' }}>
              {currentStory.user_profile?.avatar_url && (
                <img
                  src={currentStory.user_profile.avatar_url}
                  alt=""
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '2px solid #FFF',
                  }}
                />
              )}
              <span style={{ color: '#FFF', fontSize: '15px', fontWeight: 'bold' }}>
                {currentStory.user_profile?.display_name || 'Snapchat Story'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleClose}
              style={{
                border: 'none',
                background: 'rgba(0,0,0,0.5)',
                color: '#FFF',
                fontSize: '20px',
                fontWeight: 'bold',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                WebkitAppearance: 'none' as any,
                appearance: 'none' as any,
                touchAction: 'manipulation',
                padding: 0,
              }}
              aria-label="Close story"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );

    if (createPortal && typeof document !== 'undefined') {
      return createPortal(webOverlay, document.body);
    }
    return webOverlay;
  }

  // ══════════════════════════════════════════════════════════════
  // NATIVE: React Native Modal with RN components
  // ══════════════════════════════════════════════════════════════
  const nativeUI = (
    <View style={nativeStyles.container}>
      {currentStory.media_type === 'video' ? (
        <Video
          source={{ uri: currentStory.media_url }}
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.COVER}
          shouldPlay
        />
      ) : (
        <Image
          source={{ uri: currentStory.media_url }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      )}

      <View style={nativeStyles.touchOverlay}>
        <Pressable style={nativeStyles.leftTouch} onPress={previousStory} />
        <Pressable style={nativeStyles.rightTouch} onPress={advanceStory} />
      </View>

      <SafeAreaView style={nativeStyles.topOverlay}>
        <View style={nativeStyles.segmentedProgressContainer}>
          {activeStories.map((s, idx) => (
            <View key={s.id || idx} style={nativeStyles.segmentBackground}>
              {idx === currentIndex ? (
                <Animated.View style={[nativeStyles.segmentFill, animatedStyle]} />
              ) : (
                <View
                  style={[
                    nativeStyles.segmentFill,
                    { width: idx < currentIndex ? '100%' : '0%' },
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        <View style={nativeStyles.authorHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {currentStory.user_profile?.avatar_url && (
              <Image
                source={{ uri: currentStory.user_profile.avatar_url }}
                style={nativeStyles.authorAvatar}
              />
            )}
            <Text style={nativeStyles.authorName}>
              {currentStory.user_profile?.display_name || 'Snapchat Story'}
            </Text>
          </View>

          <Pressable onPress={handleClose} style={nativeStyles.closeBtn}>
            <Text style={nativeStyles.closeIcon}>✕</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleClose}
    >
      {nativeUI}
    </Modal>
  );
};

const nativeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 10,
  },
  leftTouch: {
    flex: 1,
    height: '100%',
  },
  rightTouch: {
    flex: 2,
    height: '100%',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  segmentedProgressContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  segmentBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  authorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFF',
    marginRight: 8,
  },
  authorName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  closeBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default StoryViewerModal;
