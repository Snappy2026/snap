// ============================================================================
// SnapViewerScreen Component
// Ephemeral snap viewer with Reanimated countdown progress bar & auto-deletion Edge Function call.
// ============================================================================

import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
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
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

type SnapViewerRouteProp = RouteProp<RootStackParamList, 'SnapViewer'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SnapViewerScreen: React.FC = () => {
  const route = useRoute<SnapViewerRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { snap } = route.params;

  const progress = useSharedValue(0);
  const videoRef = useRef<Video>(null);
  const hasTriggeredDelete = useRef(false);

  // Trigger Ephemeral Cleanup RPC / Edge Function
  const triggerAutoDeletion = async () => {
    if (hasTriggeredDelete.current) return;
    hasTriggeredDelete.current = true;

    try {
      console.log(`[SnapViewer] Triggering deletion for snap_id: ${snap.id}`);

      // Call Supabase Edge Function to purge media file from storage & DB
      const { data, error } = await supabase.functions.invoke('delete-viewed-snap', {
        body: { snap_id: snap.id },
      });

      if (error) {
        console.warn('[SnapViewer Warning] Edge function call error:', error.message);
        // Fallback: direct database update if edge function is offline locally
        await (supabase.from('snaps') as any)
          .update({ viewed_at: new Date().toISOString() })
          .eq('id', snap.id);
      } else {
        console.log('[SnapViewer] Edge Function response:', data);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Cleanup error';
      console.error('[SnapViewer Error] Cleanup failed:', errorMessage);
    } finally {
      navigation.goBack();
    }
  };

  useEffect(() => {
    // Start countdown progress bar animation
    const durationMs = (snap.duration || 5) * 1000;

    progress.value = withTiming(
      1,
      {
        duration: durationMs,
        easing: Easing.linear,
      },
      (finished?: boolean) => {
        if (finished) {
          runOnJS(triggerAutoDeletion)();
        }
      }
    );
  }, [snap.duration]);

  // Reanimated style for top progress indicator bar
  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={styles.container}
      onPress={triggerAutoDeletion} // Tap screen to skip/close snap immediately
    >
      {/* Media Content Stream */}
      {snap.media_type === 'image' ? (
        <Image
          source={{ uri: snap.media_url }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : (
        <Video
          ref={videoRef}
          source={{ uri: snap.media_url }}
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping={false}
        />
      )}

      {/* Top Overlay: Progress Countdown Bar & Sender Info */}
      <SafeAreaView style={styles.overlayContainer}>
        <View style={styles.progressBackground}>
          <Animated.View style={[styles.progressBar, animatedProgressStyle]} />
        </View>

        <View style={styles.senderHeader}>
          <Text style={styles.senderName}>
            {snap.sender_profile?.display_name || snap.sender_profile?.username || 'Snapchat Friend'}
          </Text>
          <Text style={styles.timerText}>{snap.duration}s</Text>
        </View>
      </SafeAreaView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlayContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  progressBackground: {
    height: 4,
    width: width - 32,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFF',
  },
  senderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  senderName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  timerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
});

export default SnapViewerScreen;
