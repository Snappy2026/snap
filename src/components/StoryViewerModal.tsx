// ============================================================================
// StoryViewerModal Component
// Uses React Native <Modal> on ALL platforms (web + native).
// On web, the story content uses native HTML elements for iOS Safari compat.
// createPortal was causing invisible rendering on iOS Safari.
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { supabase } from "../lib/supabase";
import CreatorProfileModal from "./CreatorProfileModal";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  runOnJS,
  Easing,
} from "react-native-reanimated";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export interface StoryViewerItem {
  id: string;
  user_id?: string;
  media_url: string;
  media_type?: "image" | "video" | string;
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

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "creator" | "customer">(
    "customer",
  );
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [showCreatorProfile, setShowCreatorProfile] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
        setUserRole(data.user.user_metadata?.role || "customer");
      }
    };
    fetchUser();
  }, []);

  const fallbackStory: StoryViewerItem = {
    id: "demo-story",
    media_url:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
    media_type: "image",
    user_profile: { display_name: "Adult+ Story" },
  };

  const activeStories =
    stories && stories.length > 0 ? stories : [fallbackStory];
  const currentStory =
    activeStories[currentIndex] || activeStories[0] || fallbackStory;

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUserId || !currentStory.user_id) {
        setIsFollowing(false);
        return;
      }
      try {
        const { data, error } = await (supabase.from("friendships") as any)
          .select("id")
          .eq("requester_id", currentUserId)
          .eq("addressee_id", currentStory.user_id)
          .eq("status", "accepted")
          .maybeSingle();

        setIsFollowing(!!data && !error);
      } catch (err) {
        console.error(err);
      }
    };

    if (visible) {
      checkFollowStatus();
    }
  }, [visible, currentStory.id, currentUserId]);

  const handleFollow = async () => {
    if (!currentUserId || !currentStory.user_id) return;
    setIsFollowingLoading(true);
    try {
      await (supabase.from("friendships") as any).insert({
        requester_id: currentUserId,
        addressee_id: currentStory.user_id,
        status: "accepted",
      });
      setIsFollowing(true);
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setIsFollowingLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      progress.value = 0;
    } else {
      cancelAnimation(progress);
    }
  }, [visible, initialIndex]);

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
    progress.value = withTiming(1, { duration: 5000, easing: Easing.linear });

    const timer = setTimeout(() => {
      advanceStory();
    }, 5000);

    return () => {
      clearTimeout(timer);
      cancelAnimation(progress);
    };
  }, [currentIndex, visible, advanceStory, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  // ── Build the story content based on platform ──
  const storyContent =
    Platform.OS === "web" ? (
      // WEB: Pure HTML elements for iOS Safari compatibility
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#000",
          position: "relative" as any,
          overflow: "hidden",
        }}
      >
        {/* Background Media */}
        {currentStory.media_type === "video" ? (
          <video
            src={currentStory.media_url}
            autoPlay
            playsInline
            muted={false}
            loop={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
        ) : (
          <img
            src={currentStory.media_url}
            alt="Story"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
        )}

        {/* Touch zones */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "row" as any,
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={previousStory}
            style={{
              flex: 1,
              height: "100%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              WebkitAppearance: "none" as any,
              appearance: "none" as any,
              touchAction: "manipulation",
              padding: 0,
            }}
            aria-label="Previous"
          />
          <button
            type="button"
            onClick={advanceStory}
            style={{
              flex: 2,
              height: "100%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              WebkitAppearance: "none" as any,
              appearance: "none" as any,
              touchAction: "manipulation",
              padding: 0,
            }}
            aria-label="Next"
          />
        </div>

        {/* Top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            padding: "12px 16px",
            paddingTop: "max(12px, env(safe-area-inset-top))",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
          }}
        >
          {/* Progress segments */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
            {activeStories.map((s, idx) => (
              <div
                key={s.id || idx}
                style={{
                  flex: 1,
                  height: "3px",
                  backgroundColor: "rgba(255,255,255,0.3)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    backgroundColor: "#FFF",
                    borderRadius: "2px",
                    width:
                      idx < currentIndex
                        ? "100%"
                        : idx === currentIndex
                          ? "0%"
                          : "0%",
                    ...(idx === currentIndex
                      ? {
                          animation: "storyProgress 5s linear forwards",
                        }
                      : {}),
                  }}
                />
              </div>
            ))}
          </div>

          {/* Author + close */}
          <div
            style={{
              display: "flex",
              flexDirection: "row" as any,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Creator Profile Avatar Button */}
              {currentStory.user_id && currentStory.user_id !== currentUserId && (
                <button
                  type="button"
                  onClick={() => {
                    cancelAnimation(progress);
                    setShowCreatorProfile(true);
                  }}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.6)",
                    background: "rgba(0,0,0,0.3)",
                    cursor: "pointer",
                    padding: 0,
                    overflow: "hidden",
                    WebkitAppearance: "none" as any,
                    appearance: "none" as any,
                    touchAction: "manipulation",
                    flexShrink: 0,
                  }}
                  aria-label="View Creator Profile"
                >
                  <img
                    src={currentStory.user_profile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80"}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                </button>
              )}
              <span
                style={{
                  color: "#FFF",
                  fontSize: "15px",
                  fontWeight: "bold",
                  cursor: currentStory.user_id && currentStory.user_id !== currentUserId ? "pointer" : "default",
                }}
                onClick={() => {
                  if (currentStory.user_id && currentStory.user_id !== currentUserId) {
                    cancelAnimation(progress);
                    setShowCreatorProfile(true);
                  }
                }}
              >
                {currentStory.user_profile?.display_name || "Adult+ Story"}
              </span>
              {userRole === "customer" &&
                !isFollowing &&
                currentStory.user_id &&
                currentStory.user_id !== currentUserId && (
                  <button
                    type="button"
                    onClick={handleFollow}
                    disabled={isFollowingLoading}
                    style={{
                      background: "#D4AF37",
                      color: "#000",
                      border: "none",
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      zIndex: 30,
                    }}
                  >
                    {isFollowingLoading ? "..." : "Follow"}
                  </button>
                )}
            </div>
            <button
              type="button"
              onClick={handleClose}
              style={{
                border: "none",
                background: "rgba(0,0,0,0.5)",
                color: "#FFF",
                fontSize: "20px",
                fontWeight: "bold",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                WebkitAppearance: "none" as any,
                appearance: "none" as any,
                touchAction: "manipulation",
                padding: 0,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* CSS animation for progress bar */}
        <style>{`
        @keyframes storyProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
      </div>
    ) : (
      // NATIVE: React Native components
      <View style={nativeStyles.container}>
        {currentStory.media_type === "video" ? (
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
                  <Animated.View
                    style={[nativeStyles.segmentFill, animatedStyle]}
                  />
                ) : (
                  <View
                    style={[
                      nativeStyles.segmentFill,
                      { width: idx < currentIndex ? "100%" : "0%" },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>

          <View style={nativeStyles.authorHeader}>
            <Text style={nativeStyles.authorName}>
              {currentStory.user_profile?.display_name || "Adult+ Story"}
            </Text>
            <Pressable onPress={handleClose} style={nativeStyles.closeBtn}>
              <Text style={nativeStyles.closeIcon}>✕</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );

  // ── Use React Native <Modal> on ALL platforms ──
  // This is proven to work on iOS Safari (the Add Story modal uses it)
  return (
    <>
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleClose}
    >
      {storyContent}
    </Modal>

    {/* Creator Profile Modal */}
    {showCreatorProfile && currentStory.user_id && (
      <CreatorProfileModal
        visible={showCreatorProfile}
        creatorId={currentStory.user_id}
        onClose={() => setShowCreatorProfile(false)}
      />
    )}
    </>
  );
};

const nativeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 10,
  },
  leftTouch: {
    flex: 1,
    height: "100%",
  },
  rightTouch: {
    flex: 2,
    height: "100%",
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  segmentedProgressContainer: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 12,
  },
  segmentBackground: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  segmentFill: {
    height: "100%",
    backgroundColor: "#FFF",
    borderRadius: 2,
  },
  authorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  authorName: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  closeBtn: {
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default StoryViewerModal;
