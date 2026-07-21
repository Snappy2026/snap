// ============================================================================
// StoryViewerModal Component
// 100% Full-Screen Story Player.
// On Web: uses ReactDOM.createPortal to mount directly on document.body,
// bypassing ALL parent container clipping (SafeAreaView, ScrollView, etc.)
// On Native: uses React Native <Modal> for native full-screen overlay.
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
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

// Web-only: import createPortal to escape parent DOM tree
let createPortal: any = null;
if (Platform.OS === 'web') {
  try {
    createPortal = require('react-dom').createPortal;
  } catch (e) {
    // Fallback: will render inline if createPortal not available
  }
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

  // Reset index when modal opens
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

  // ── The actual full-screen story UI ──
  const storyUI = (
    <View style={webStyles.fullScreenContainer}>
      {/* Background Media */}
      {currentStory.media_type === 'video' ? (
        Platform.OS === 'web' ? (
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
          <Video
            source={{ uri: currentStory.media_url }}
            style={StyleSheet.absoluteFillObject}
            resizeMode={ResizeMode.COVER}
            shouldPlay
          />
        )
      ) : (
        <Image
          source={{ uri: currentStory.media_url }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      )}

      {/* Touch zones: left = previous, right = next */}
      <View style={nativeStyles.touchOverlay}>
        <TouchableOpacity style={nativeStyles.leftTouch} onPress={previousStory} activeOpacity={1} />
        <TouchableOpacity style={nativeStyles.rightTouch} onPress={advanceStory} activeOpacity={1} />
      </View>

      {/* Top bar: progress segments + author + close */}
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

          <TouchableOpacity onPress={handleClose} style={nativeStyles.closeBtn}>
            <Text style={nativeStyles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );

  // ── WEB: use createPortal to mount on document.body ──
  if (Platform.OS === 'web') {
    if (createPortal && typeof document !== 'undefined') {
      return createPortal(storyUI, document.body);
    }
    // Fallback if createPortal unavailable: render inline with fixed positioning
    return storyUI;
  }

  // ── NATIVE: use <Modal> ──
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleClose}
    >
      {storyUI}
    </Modal>
  );
};

// Web-specific styles using fixed viewport units
const webStyles = StyleSheet.create({
  fullScreenContainer: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: Platform.OS === 'web' ? ('100vw' as any) : '100%',
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    backgroundColor: '#000',
    zIndex: 9999999,
  },
});

const nativeStyles = StyleSheet.create({
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
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 12 : 24,
    zIndex: 20,
  },
  segmentedProgressContainer: {
    flexDirection: 'row',
    height: 4,
    gap: 4,
    marginTop: 6,
  },
  segmentBackground: {
    flex: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    backgroundColor: '#FFF',
  },
  authorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#FFFC00',
  },
  authorName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StoryViewerModal;
