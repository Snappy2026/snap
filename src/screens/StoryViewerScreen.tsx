// ============================================================================
// StoryViewerScreen Component
// Full-screen 24-hour story reel viewer with top segmented progress bar & touch advance.
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
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const { width } = Dimensions.get('window');

type StoryViewerRouteProp = RouteProp<RootStackParamList, 'StoryViewer'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const StoryViewerScreen: React.FC = () => {
  const route = useRoute<StoryViewerRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { stories, initialIndex = 0 } = route.params;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const progress = useSharedValue(0);

  const currentStory = stories[currentIndex] || {
    id: 'demo-story',
    media_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    media_type: 'image',
    user_profile: { display_name: 'Sarah Connor' },
  };

  const advanceStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      progress.value = 0;
    } else {
      navigation.goBack();
    }
  };

  const previousStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      progress.value = 0;
    } else {
      navigation.goBack();
    }
  };

  useEffect(() => {
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
  }, [currentIndex]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      {/* Media View */}
      {currentStory.media_type === 'image' ? (
        <Image
          source={{ uri: currentStory.media_url }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : Platform.OS === 'web' ? (
        <video
          src={currentStory.media_url}
          autoPlay
          playsInline
          loop={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }}
        />
      ) : (
        <Video
          source={{ uri: currentStory.media_url }}
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.COVER}
          shouldPlay
        />
      )}

      {/* Left/Right Touch Touch Areas */}
      <View style={styles.touchOverlay}>
        <TouchableOpacity style={styles.leftTouch} onPress={previousStory} />
        <TouchableOpacity style={styles.rightTouch} onPress={advanceStory} />
      </View>

      {/* Top Segmented Progress Bar & Author Header */}
      <SafeAreaView style={styles.topOverlay}>
        <View style={styles.segmentedProgressContainer}>
          {stories.map((s, idx) => (
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
          <Text style={styles.authorName}>
            {currentStory.user_profile?.display_name || 'Snapchat Story'}
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 5,
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
    paddingTop: 10,
    zIndex: 10,
  },
  segmentedProgressContainer: {
    flexDirection: 'row',
    height: 4,
    gap: 4,
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
  },
  authorName: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  closeIcon: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    padding: 4,
  },
});

export default StoryViewerScreen;
