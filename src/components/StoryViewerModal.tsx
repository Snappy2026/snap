// ============================================================================
// StoryViewerModal Component
// Instant 100% Full-Screen 24-Hour Story Player Modal overlay for web & mobile.
// Prevents navigation route drops and plays story reels seamlessly!
// ============================================================================

import React, { useState, useEffect } from 'react';
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
  runOnJS,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

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

  const advanceStory = () => {
    if (currentIndex < activeStories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      progress.value = 0;
    } else {
      onClose();
    }
  };

  const previousStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      progress.value = 0;
    } else {
      onClose();
    }
  };

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
  }, [currentIndex, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Media Background Display */}
        {currentStory.media_type === 'video' ? (
          Platform.OS === 'web' ? (
            <video
              src={currentStory.media_url}
              autoPlay
              playsInline
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

        {/* Left & Right Touch Advance Overlay */}
        <View style={styles.touchOverlay}>
          <TouchableOpacity style={styles.leftTouch} onPress={previousStory} activeOpacity={1} />
          <TouchableOpacity style={styles.rightTouch} onPress={advanceStory} activeOpacity={1} />
        </View>

        {/* Top Segmented Progress Bar & Author Header */}
        <SafeAreaView style={styles.topOverlay}>
          <View style={styles.segmentedProgressContainer}>
            {activeStories.map((s, idx) => (
              <View key={s.id || idx} style={styles.segmentBackground}>
                {idx === currentIndex ? (
                  <Animated.View style={[styles.segmentFill, animatedStyle]} />
                ) : (
                  <View
                    style={[
                      styles.segmentFill,
                      { width: idx < currentIndex ? '100%' : '0%' },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>

          <View style={styles.authorHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {currentStory.user_profile?.avatar_url && (
                <Image
                  source={{ uri: currentStory.user_profile.avatar_url }}
                  style={styles.authorAvatar}
                />
              )}
              <Text style={styles.authorName}>
                {currentStory.user_profile?.display_name || 'Snapchat Story'}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
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
