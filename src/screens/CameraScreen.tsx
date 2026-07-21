// ============================================================================
// CameraScreen Component
// Integrated Hardware & Web HTML5 camera with SnapBar header, AR Lens Carousel,
// 1-Tap "➕ Story" button, and navigation to SendToModal recipient selector.
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { supabase } from '../lib/supabase';
import SnapBar from '../components/SnapBar';
import LensCarousel, { ARLens } from '../components/LensCarousel';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Dynamically load native VisionCamera on native platforms only
let VisionCamera: any = null;
let useCameraDeviceHook: any = () => null;
let useCameraPermissionHook: any = () => ({ hasPermission: true, requestPermission: async () => true });
let useMicrophonePermissionHook: any = () => ({ hasPermission: true, requestPermission: async () => true });

if (Platform.OS !== 'web') {
  try {
    const vc = require('react-native-vision-camera');
    VisionCamera = vc.Camera;
    useCameraDeviceHook = vc.useCameraDevice;
    useCameraPermissionHook = vc.useCameraPermission;
    useMicrophonePermissionHook = vc.useMicrophonePermission;
  } catch (e) {
    console.warn('VisionCamera native module unavailable');
  }
}

export const CameraScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation<NavigationProp>();

  // Hardware Camera Permissions & Device Selection (Native)
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } =
    useCameraPermissionHook();
  const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } =
    useMicrophonePermissionHook();

  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeLens, setActiveLens] = useState<ARLens | null>(null);

  // Web camera state & MediaRecorder
  const webVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<any>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const webStreamRef = useRef<MediaStream | null>(null);
  const [webStreamActive, setWebStreamActive] = useState(false);

  const device = useCameraDeviceHook(cameraPosition);
  const cameraRef = useRef<any>(null);

  // Reanimated button animations
  const shutterScale = useSharedValue(1);
  const recordingProgress = useSharedValue(0);

  // Initialize & Update Web Webcam stream when cameraPosition changes
  useEffect(() => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      // Stop existing tracks before starting new stream
      if (webStreamRef.current) {
        webStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const facingMode = cameraPosition === 'back' ? 'environment' : 'user';
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: { ideal: facingMode } },
          audio: true,
        })
        .then((stream) => {
          webStreamRef.current = stream;
          if (webVideoRef.current) {
            webVideoRef.current.srcObject = stream;
            webVideoRef.current.play();
            setWebStreamActive(true);
          }
        })
        .catch((err) => {
          console.warn('[Web Camera Warning] Webcam permission or device notice:', err.message);
          // Fallback to basic video stream without facingMode constraint
          navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
              webStreamRef.current = stream;
              if (webVideoRef.current) {
                webVideoRef.current.srcObject = stream;
                webVideoRef.current.play();
                setWebStreamActive(true);
              }
            })
            .catch((e) => console.warn('[Web Camera Fallback Error]', e));
        });
    }
  }, [cameraPosition]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      (async () => {
        if (!hasCameraPermission) await requestCameraPermission();
        if (!hasMicPermission) await requestMicPermission();
      })();
    }
  }, [hasCameraPermission, hasMicPermission]);

  // Handle Photo Capture & Navigate to SendToModal
  const takePhoto = async () => {
    try {
      shutterScale.value = withSpring(0.85, {}, () => {
        shutterScale.value = withSpring(1);
      });

      if (Platform.OS === 'web') {
        if (webVideoRef.current) {
          const video = webVideoRef.current;
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            processAndNavigateToSendTo(dataUrl, 'image');
          }
        } else {
          const dummySvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="100%" height="100%" fill="%231a1a2e"/><text x="50%" y="50%" fill="%23FFFC00" font-size="30" font-family="sans-serif" text-anchor="middle">Snapchat Web Snap</text></svg>';
          processAndNavigateToSendTo(dummySvg, 'image');
        }
      } else {
        if (!cameraRef.current) return;
        const photo = await cameraRef.current.takePhoto({
          flash: flashMode,
          enableShutterSound: true,
        });
        processAndNavigateToSendTo(`file://${photo.path}`, 'image');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Photo capture failed';
      console.error('[Camera Error] Photo capture failed:', errorMessage);
      Alert.alert('Capture Error', errorMessage);
    }
  };

  // Handle Video Recording with Web MediaRecorder & Native VisionCamera
  const startRecording = async () => {
    if (isRecording) return;
    try {
      setIsRecording(true);
      shutterScale.value = withSpring(1.3);
      recordingProgress.value = withTiming(1, { duration: 5000, easing: Easing.linear });

      if (Platform.OS === 'web') {
        recordedChunksRef.current = [];
        if (webStreamRef.current && typeof MediaRecorder !== 'undefined') {
          const recorder = new MediaRecorder(webStreamRef.current);
          mediaRecorderRef.current = recorder;
          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              recordedChunksRef.current.push(event.data);
            }
          };
          recorder.start();
        }
      } else if (cameraRef.current) {
        cameraRef.current.startRecording({
          flash: flashMode,
          onRecordingFinished: async (video: any) => {
            setIsRecording(false);
            shutterScale.value = withSpring(1);
            recordingProgress.value = 0;
            processAndNavigateToSendTo(`file://${video.path}`, 'video');
          },
          onRecordingError: (error: any) => {
            setIsRecording(false);
            shutterScale.value = withSpring(1);
            recordingProgress.value = 0;
            console.error('[Camera Error] Video recording failed:', error.message);
          },
        });
      }
    } catch (err: unknown) {
      setIsRecording(false);
      const errorMessage = err instanceof Error ? err.message : 'Recording error';
      Alert.alert('Recording Error', errorMessage);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    if (Platform.OS === 'web') {
      setIsRecording(false);
      shutterScale.value = withSpring(1);
      recordingProgress.value = 0;

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const videoUrl = URL.createObjectURL(blob);
          processAndNavigateToSendTo(videoUrl, 'video');
        };
        mediaRecorderRef.current.stop();
      } else {
        const dummySvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="100%" height="100%" fill="%2316213e"/><text x="50%" y="50%" fill="%23FF3B30" font-size="30" font-family="sans-serif" text-anchor="middle">Snapchat Web Video Snap</text></svg>';
        processAndNavigateToSendTo(dummySvg, 'video');
      }
    } else if (cameraRef.current) {
      await cameraRef.current.stopRecording();
    }
  };

  // Process captured media asset & navigate to SendToModal recipient selector
  const processAndNavigateToSendTo = (fileUri: string, type: 'image' | 'video') => {
    setIsProcessing(true);
    navigation.navigate('SendToModal', {
      mediaUrl: fileUri,
      mediaType: type,
      duration: 5,
    });
    setIsProcessing(false);
  };

  // 1-Tap Instant Post to My Story
  const handleInstantPostStory = async () => {
    takePhoto();
  };

  // Double-tap gesture to flip camera
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      setCameraPosition((prev) => (prev === 'back' ? 'front' : 'back'));
    });

  const singleTapGesture = Gesture.Tap().onEnd(() => {
    takePhoto();
  });

  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      startRecording();
    })
    .onEnd(() => {
      stopRecording();
    });

  const shutterGesture = Gesture.Simultaneous(singleTapGesture, longPressGesture);

  const animatedShutterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  return (
    <GestureDetector gesture={doubleTapGesture}>
      <View style={styles.container}>
        {/* Top SnapBar Header */}
        <SnapBar
          title="Camera"
          onProfilePress={() => navigation.navigate('Auth')}
        />

        {/* Viewfinder Stream */}
        {Platform.OS === 'web' ? (
          <View style={styles.webCameraContainer}>
            <video
              ref={webVideoRef as any}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
              }}
            />
            {!webStreamActive && (
              <View style={styles.webFallbackOverlay}>
                <Text style={styles.webCameraEmoji}>📷</Text>
                <Text style={styles.webCameraTitle}>Snapchat Camera View</Text>
                <Text style={styles.webCameraSubtitle}>
                  Select a lens below or tap the shutter to capture a snap.
                </Text>
              </View>
            )}

            {/* Simulated AR Lens Color Filter Overlay */}
            {activeLens && activeLens.filterOverlay && (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: activeLens.filterOverlay, pointerEvents: 'none' },
                ]}
              />
            )}
          </View>
        ) : isFocused && VisionCamera && device ? (
          <VisionCamera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isFocused}
            photo={true}
            video={true}
            audio={true}
          />
        ) : (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>Initializing Camera Viewfinder...</Text>
            <ActivityIndicator size="large" color="#FFFC00" style={{ marginTop: 20 }} />
          </View>
        )}

        {/* Side Camera Action Tools */}
        <View style={styles.sideControls}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setFlashMode(flashMode === 'off' ? 'on' : 'off')}
          >
            <Text style={styles.iconText}>{flashMode === 'on' ? '⚡️' : '📸'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setCameraPosition(cameraPosition === 'back' ? 'front' : 'back')}
          >
            <Text style={styles.iconText}>🔄</Text>
          </TouchableOpacity>

          {/* Quick Post Story Button */}
          <TouchableOpacity
            style={[styles.iconButton, styles.storyQuickBtn]}
            onPress={handleInstantPostStory}
          >
            <Text style={styles.iconText}>➕</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Section: AR Lens Carousel & Shutter Button */}
        <View style={styles.bottomControls}>
          <LensCarousel onSelectLens={(lens) => setActiveLens(lens)} />

          {isProcessing ? (
            <ActivityIndicator size="large" color="#FFFC00" />
          ) : (
            <View style={styles.shutterRow}>
              <GestureDetector gesture={shutterGesture}>
                <Animated.View style={[styles.shutterOuterRing, animatedShutterStyle]}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={takePhoto}
                    style={[
                      styles.shutterInnerCircle,
                      isRecording && styles.shutterInnerCircleRecording,
                    ]}
                  />
                </Animated.View>
              </GestureDetector>
            </View>
          )}
        </View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webCameraContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050510',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webFallbackOverlay: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  webCameraEmoji: {
    fontSize: 70,
    marginBottom: 15,
  },
  webCameraTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  webCameraSubtitle: {
    color: '#A0A0B0',
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 400,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  sideControls: {
    position: 'absolute',
    top: 110,
    right: 16,
    flexDirection: 'column',
    gap: 15,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  storyQuickBtn: {
    backgroundColor: 'rgba(157, 78, 221, 0.6)',
    borderColor: '#9D4EDD',
  },
  iconText: {
    fontSize: 20,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 95,
    width: width,
    alignItems: 'center',
    zIndex: 10,
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuterRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  shutterInnerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
  },
  shutterInnerCircleRecording: {
    backgroundColor: '#FF3B30',
    width: 46,
    height: 46,
    borderRadius: 10,
  },
});

export default CameraScreen;
