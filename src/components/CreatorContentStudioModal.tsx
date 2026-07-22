// ============================================================================
// CreatorContentStudioModal Component
// Creator Content Management Studio allowing Creators to manage & delete
// their posted 24-hour Stories, Public Gallery photos/videos, and VIP Media.
// ============================================================================

import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { supabase } from "../lib/supabase";
import { Story, VipContentItem } from "../types/database";

interface CreatorContentStudioModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreatorContentStudioModal: React.FC<CreatorContentStudioModalProps> = ({
  visible,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"stories" | "gallery" | "vip">("stories");
  const [stories, setStories] = useState<Story[]>([]);
  const [galleryItems, setGalleryItems] = useState<VipContentItem[]>([]);
  const [vipItems, setVipItems] = useState<VipContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCreatorContent = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const uid = userData.user.id;

      // Fetch active 24h Stories
      const { data: storyData } = await supabase
        .from("stories")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (storyData) {
        setStories(storyData as Story[]);
      }

      // Fetch Gallery & VIP media items
      const { data: mediaData } = await supabase
        .from("vip_content")
        .select("*")
        .eq("creator_id", uid)
        .order("created_at", { ascending: false });

      if (mediaData) {
        setGalleryItems((mediaData as VipContentItem[]).filter(item => item.is_public_gallery === true));
        setVipItems((mediaData as VipContentItem[]).filter(item => item.is_public_gallery !== true));
      }
    } catch (err) {
      console.error("[Creator Studio Fetch Error]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchCreatorContent();
    }
  }, [visible]);

  const handleDeleteStory = async (id: string) => {
    try {
      const { error } = await supabase.from("stories").delete().eq("id", id);
      if (error) throw error;
      setStories(prev => prev.filter(s => s.id !== id));
      const msg = "Story post deleted successfully!";
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(msg);
      } else {
        Alert.alert("Deleted", msg);
      }
    } catch (err: any) {
      console.error("[Delete Story Error]", err);
    }
  };

  const handleDeleteVipItem = async (id: string) => {
    try {
      const { error } = await supabase.from("vip_content").delete().eq("id", id);
      if (error) throw error;
      setGalleryItems(prev => prev.filter(item => item.id !== id));
      setVipItems(prev => prev.filter(item => item.id !== id));
      const msg = "Media post deleted successfully!";
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(msg);
      } else {
        Alert.alert("Deleted", msg);
      }
    } catch (err: any) {
      console.error("[Delete Media Error]", err);
    }
  };

  const formatHoursRemaining = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const expires = created + 24 * 60 * 60 * 1000;
    const diff = expires - Date.now();
    if (diff <= 0) return "Expired (24h elapsed)";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🎨 Creator Management Studio</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "stories" && styles.activeTab]}
              onPress={() => setActiveTab("stories")}
            >
              <Text style={[styles.tabText, activeTab === "stories" && styles.activeTabText]}>
                STORIES ({stories.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "gallery" && styles.activeTab]}
              onPress={() => setActiveTab("gallery")}
            >
              <Text style={[styles.tabText, activeTab === "gallery" && styles.activeTabText]}>
                GALLERY ({galleryItems.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "vip" && styles.activeTab]}
              onPress={() => setActiveTab("vip")}
            >
              <Text style={[styles.tabText, activeTab === "vip" && styles.activeTabText]}>
                VIP ({vipItems.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content List */}
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#D4AF37" />
            </View>
          ) : (
            <View style={styles.listContainer}>
              {activeTab === "stories" && (
                stories.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No active 24-hour stories published.</Text>
                  </View>
                ) : (
                  <FlatList
                    data={stories}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                      <View style={styles.cardRow}>
                        <Image source={{ uri: item.media_url }} style={styles.previewImage} />
                        <View style={styles.cardDetails}>
                          <Text style={styles.cardTitle}>24-Hour Story Post</Text>
                          <Text style={styles.cardMeta}>{formatHoursRemaining(item.created_at)}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteStory(item.id)}
                        >
                          <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                )
              )}

              {activeTab === "gallery" && (
                galleryItems.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No Public Gallery photos/videos uploaded.</Text>
                  </View>
                ) : (
                  <FlatList
                    data={galleryItems}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                      <View style={styles.cardRow}>
                        <Image source={{ uri: item.media_url }} style={styles.previewImage} />
                        <View style={styles.cardDetails}>
                          <Text style={styles.cardTitle}>{item.title || "Gallery Item"}</Text>
                          <Text style={styles.cardMeta}>Fixed Public Gallery Content</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteVipItem(item.id)}
                        >
                          <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                )
              )}

              {activeTab === "vip" && (
                vipItems.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No VIP Exclusive Lounge media uploaded.</Text>
                  </View>
                ) : (
                  <FlatList
                    data={vipItems}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                      <View style={styles.cardRow}>
                        <Image source={{ uri: item.media_url }} style={styles.previewImage} />
                        <View style={styles.cardDetails}>
                          <Text style={styles.cardTitle}>{item.title || "VIP Exclusive"}</Text>
                          <Text style={styles.cardMeta}>👑 {item.required_tier || "VIP GOLD"} Required</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteVipItem(item.id)}
                        >
                          <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                )
              )}
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "92%",
    height: "85%",
    backgroundColor: "#121214",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "900",
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 4,
    margin: 12,
    borderRadius: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  tabText: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "800",
  },
  activeTabText: {
    color: "#D4AF37",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    color: "#8E8E93",
    fontSize: 14,
    textAlign: "center",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  previewImage: {
    width: 54,
    height: 54,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: "#1A1A1A",
  },
  cardDetails: {
    flex: 1,
  },
  cardTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
  },
  cardMeta: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  deleteBtn: {
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderWidth: 1,
    borderColor: "#FF3B30",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  deleteBtnText: {
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "800",
  },
});

export default CreatorContentStudioModal;
