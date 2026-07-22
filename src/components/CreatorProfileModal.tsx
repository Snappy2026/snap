// ============================================================================
// CreatorProfileModal Component
// Shows a creator's full profile: Stories, Gallery, and VIP content sections.
// Opened from StoryViewerModal when a customer taps the creator's profile button.
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  SafeAreaView,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useStoryViewer } from "../context/StoryViewerContext";
import { StoryViewerItem } from "./StoryViewerModal";

const { width } = Dimensions.get("window");
const gridItemWidth = (width - 48) / 3;

interface CreatorProfileModalProps {
  visible: boolean;
  creatorId: string;
  onClose: () => void;
}

interface CreatorProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  role: string;
}

const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({
  visible,
  creatorId,
  onClose,
}) => {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [vipContent, setVipContent] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"stories" | "gallery" | "vip">("stories");
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { openStoryViewer } = useStoryViewer();

  useEffect(() => {
    if (!visible || !creatorId) return;

    const fetchCreatorData = async () => {
      setLoading(true);
      try {
        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          setCurrentUserId(userData.user.id);

          // Check follow status
          const { data: followData } = await (supabase.from("friendships") as any)
            .select("id")
            .eq("requester_id", userData.user.id)
            .eq("addressee_id", creatorId)
            .eq("status", "accepted")
            .maybeSingle();
          setIsFollowing(!!followData);
        }

        // Fetch creator profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", creatorId)
          .maybeSingle();
        if (profileData) setProfile(profileData as any);

        // Fetch creator's active stories
        const { data: storyData } = await (supabase.from("stories") as any)
          .select("*")
          .eq("user_id", creatorId)
          .gte("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false });
        if (storyData) setStories(storyData);

        // Fetch creator's public gallery
        const { data: galleryData } = await (supabase.from("vip_content") as any)
          .select("*")
          .eq("creator_id", creatorId)
          .eq("is_public_gallery", true)
          .order("created_at", { ascending: false });
        if (galleryData) setGallery(galleryData);

        // Fetch creator's VIP content
        const { data: vipData } = await (supabase.from("vip_content") as any)
          .select("*")
          .eq("creator_id", creatorId)
          .eq("is_public_gallery", false)
          .order("created_at", { ascending: false });
        if (vipData) setVipContent(vipData);
      } catch (err) {
        console.error("[CreatorProfile] Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, [visible, creatorId]);

  const handleFollow = async () => {
    if (!currentUserId || !creatorId) return;
    try {
      await (supabase.from("friendships") as any).insert({
        requester_id: currentUserId,
        addressee_id: creatorId,
        status: "accepted",
      });
      setIsFollowing(true);
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  const handleStoryTap = (index: number) => {
    const viewerStories: StoryViewerItem[] = stories.map((s: any) => ({
      id: s.id,
      user_id: s.user_id,
      media_url: s.media_url,
      media_type: s.media_type || "image",
      user_profile: {
        display_name: profile?.display_name || "Creator",
        username: profile?.username,
        avatar_url: profile?.avatar_url,
      },
    }));
    onClose();
    setTimeout(() => {
      openStoryViewer(viewerStories, index);
    }, 300);
  };

  const displayName = profile?.display_name || "Creator";
  const username = profile?.username || "";

  const renderMediaGrid = (items: any[], type: string) => {
    if (items.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>
            {type === "stories" ? "📸" : type === "gallery" ? "🖼️" : "💎"}
          </Text>
          <Text style={styles.emptyText}>
            No {type} yet
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.gridContainer}>
        {items.map((item, idx) => (
          <TouchableOpacity
            key={item.id || idx}
            style={styles.gridItem}
            onPress={() => type === "stories" ? handleStoryTap(idx) : undefined}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: item.media_url }}
              style={styles.gridImage}
              resizeMode="cover"
            />
            {item.media_type === "video" && (
              <View style={styles.videoOverlay}>
                <Text style={styles.videoIcon}>▶</Text>
              </View>
            )}
            {type === "vip" && (
              <View style={styles.vipBadge}>
                <Text style={styles.vipBadgeText}>VIP</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Creator Profile</Text>
          <View style={{ width: 60 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFF" />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Info */}
            <View style={styles.profileSection}>
              <View style={styles.avatarRing}>
                <Image
                  source={{
                    uri: profile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                  }}
                  style={styles.avatar}
                />
              </View>
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.username}>@{username}</Text>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stories.length}</Text>
                  <Text style={styles.statLabel}>Stories</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{gallery.length}</Text>
                  <Text style={styles.statLabel}>Gallery</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{vipContent.length}</Text>
                  <Text style={styles.statLabel}>VIP</Text>
                </View>
              </View>

              {/* Follow Button */}
              {currentUserId && currentUserId !== creatorId && (
                <TouchableOpacity
                  style={[styles.followBtn, isFollowing && styles.followingBtn]}
                  onPress={isFollowing ? undefined : handleFollow}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                    {isFollowing ? "✓ Following" : "+ Follow"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
              {(["stories", "gallery", "vip"] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.activeTab]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                    {tab === "stories" ? "📸 Stories" : tab === "gallery" ? "🖼️ Gallery" : "💎 VIP"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Content Grid */}
            {activeTab === "stories" && renderMediaGrid(stories, "stories")}
            {activeTab === "gallery" && renderMediaGrid(gallery, "gallery")}
            {activeTab === "vip" && renderMediaGrid(vipContent, "vip")}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn: {
    width: 60,
  },
  backBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  displayName: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  username: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  statNumber: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  followBtn: {
    backgroundColor: "#FFF",
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
  },
  followingBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  followBtnText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "700",
  },
  followingBtnText: {
    color: "#FFF",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#FFF",
  },
  tabText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#FFF",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 4,
  },
  gridItem: {
    width: gridItemWidth,
    height: gridItemWidth * 1.4,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 4,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  videoOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  videoIcon: {
    color: "#FFF",
    fontSize: 10,
  },
  vipBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  vipBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 15,
  },
});

export default CreatorProfileModal;
