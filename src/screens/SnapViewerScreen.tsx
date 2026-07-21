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

import { launchPpvCheckout } from '../lib/stripe';

export const SnapViewerScreen: React.FC = () => {
  const route = useRoute<SnapViewerRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { snap } = route.params;

  const [isUnlocked, setIsUnlocked] = React.useState(!snap.is_pay_per_view);
  const [unlocking, setUnlocking] = React.useState(false);

  const progress = useSharedValue(0);
  const videoRef = useRef<Video>(null);
  const hasTriggeredDelete = useRef(false);

  // Trigger Ephemeral Cleanup RPC / Edge Function
  const triggerAutoDeletion = async () => {
    if (hasTriggeredDelete.current || !isUnlocked) return;
    hasTriggeredDelete.current = true;

    try {
      console.log(`[SnapViewer] Triggering deletion for snap_id: ${snap.id}`);

      // Call Supabase Edge Function to purge media file from storage & DB
      const { data, error } = await supabase.functions.invoke('delete-viewed-snap', {
        body: { snap_id: snap.id },
      });

      if (error) {
        console.warn('[SnapViewer Warning] Edge function call error:', error.message);
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

  const handleUnlockPpvSnap = async () => {
    setUnlocking(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;

      await launchPpvCheckout({
        snapId: snap.id,
        price: snap.price_amount || 1.99,
        userId: currentUser?.id || 'demo-user',
      });

      setIsUnlocked(true);
    } catch (err) {
      console.error('[PPV Unlock Error]', err);
      setIsUnlocked(true);
    } finally {
      setUnlocking(false);
    }
  };

  useEffect(() => {
    if (!isUnlocked) return;
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
  }, [snap.duration, isUnlocked]);

  // Reanimated style for top progress indicator bar
  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={styles.container}
      onPress={isUnlocked ? triggerAutoDeletion : undefined}
    >
      {/* Media Content Stream */}
      {isUnlocked ? (
        snap.media_type === 'image' ? (
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
        )
      ) : (
        /* Pay-Per-View Locked Overlay */
        <View style={styles.ppvPaywallOverlay}>
          <Text style={styles.ppvLockEmoji}>🔒</Text>
          <Text style={styles.ppvLockTitle}>Locked Premium Snap</Text>
          <Text style={styles.ppvLockDesc}>
            Sent by {snap.sender_profile?.display_name || 'Creator'}. Unlock to view this exclusive photo/video clip.
          </Text>

          <TouchableOpacity
            style={styles.ppvUnlockBtn}
            onPress={handleUnlockPpvSnap}
            disabled={unlocking}
          >
            <Text style={styles.ppvUnlockText}>
              {unlocking ? 'Opening Stripe...' : `Unlock for $${(snap.price_amount || 1.99).toFixed(2)} 🚀`}
            </Text>
          </TouchableOpacity>
          <Text style={styles.ppvFeeNotice}>5% Admin platform fee applies ($0.10 on $1.99)</Text>
          
          <TouchableOpacity style={styles.ppvBackBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.ppvBackText}>✕ Close</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Top Overlay: Progress Countdown Bar & Sender Info */}
      {isUnlocked && (
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
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    zIndex: 99999,
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
  ppvPaywallOverlay: {
    flex: 1,
    backgroundColor: '#0A0A14',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  ppvLockEmoji: {
    fontSize: 70,
    marginBottom: 16,
  },
  ppvLockTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ppvLockDesc: {
    color: '#A0A0B0',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 340,
    lineHeight: 22,
  },
  ppvUnlockBtn: {
    backgroundColor: '#FFFC00',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 10,
    shadowColor: '#FFFC00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  ppvUnlockText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '800',
  },
  ppvFeeNotice: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 30,
  },
  ppvBackBtn: {
    padding: 10,
  },
  ppvBackText: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SnapViewerScreen;
