// ============================================================================
// StoriesScreen Component (Discover & Stories)
// Integrated CategoryFilterBar, Friends Stories Row, Subscriptions Carousel,
// and dynamic category filtering for the Discover Grid.
// ============================================================================

import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import WebTouchable from "../components/WebTouchable";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { supabase } from "../lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { Story } from "../types/database";
import SnapBar from "../components/SnapBar";

const { width } = Dimensions.get("window");
const cardWidth = (width - 36) / 2;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FriendStoryItem {
  id: string;
  name: string;
  avatar: string;
  hasUnseen: boolean;
  storyMedia: string;
}

interface Subscription {
  id: string;
  title: string;
  author: string;
  image: string;
}

interface DiscoverItem {
  id: string;
  title: string;
  publisher: string;
  image: string;
  category: string;
}

const FRIEND_STORIES: FriendStoryItem[] = [
  {
    id: "1",
    name: "Sarah",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    hasUnseen: true,
    storyMedia:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800",
  },
  {
    id: "2",
    name: "Alex",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    hasUnseen: true,
    storyMedia:
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800",
  },
  {
    id: "3",
    name: "Maya",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    hasUnseen: false,
    storyMedia:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
  },
  {
    id: "4",
    name: "Jordan",
    avatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
    hasUnseen: true,
    storyMedia:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800",
  },
  {
    id: "5",
    name: "Emma",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150",
    hasUnseen: false,
    storyMedia:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
  },
];

const SUBSCRIPTIONS: Subscription[] = [
  {
    id: "s1",
    title: "10 Mind-Blowing AI Innovations of 2026",
    author: "Tech Daily",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
  },
  {
    id: "s2",
    title: "Secret Street Food Spots in Tokyo 🍜",
    author: "Foodie Travel",
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400",
  },
  {
    id: "s3",
    title: "Ultimate 15-Min Workout Routine",
    author: "FitLife",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400",
  },
];

const FOR_YOU: DiscoverItem[] = [
  {
    id: "f1",
    title: "What Happens When You Fly Through Saturn Rings?",
    publisher: "Cosmos Mag",
    category: "SCIENCE",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400",
  },
  {
    id: "f2",
    title: "Inside the World Most Exclusive Cyber Supercars",
    publisher: "Motor Trend",
    category: "AUTO",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400",
  },
  {
    id: "f3",
    title: "Next Gen Gaming Specs & Unreal Engine 5.5",
    publisher: "IGN Snap",
    category: "GAMING",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400",
  },
  {
    id: "f4",
    title: "5 Aesthetic Room Makeovers You Can Do Under $100",
    publisher: "Design Digest",
    category: "LIFESTYLE",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400",
  },
  {
    id: "f5",
    title: "Quantum Computing Break-Through in Silicon Valley",
    publisher: "Tech Crunch",
    category: "TECH",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400",
  },
  {
    id: "f6",
    title: "Top 10 Hidden Ramen Joints in Kyoto",
    publisher: "Food & Wine",
    category: "FOOD",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400",
  },
];

import { sessionStore } from "../lib/sessionStore";
import { StoryViewerItem } from "../components/StoryViewerModal";
import { useStoryViewer } from "../context/StoryViewerContext";

export const StoriesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const { openStoryViewer } = useStoryViewer();
  const [dbStories, setDbStories] = useState<Story[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [isVipMember, setIsVipMember] = useState(false);
  const [userRole, setUserRole] = useState("customer");
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [vipItems, setVipItems] = useState<any[]>([]);
  const [uploadDestination, setUploadDestination] = useState<
    "story" | "gallery" | "vip"
  >("story");

  const fileInputRef = useRef<any>(null);

  useEffect(() => {
    if (!isFocused) return;

    const fetchStories = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        setCurrentUserId(user?.id || null);

        if (user?.id) {
          const { data: profileData } = (await supabase
            .from("profiles")
            .select("role, is_vip_member")
            .eq("id", user.id)
            .single()) as any;
          setIsVipMember(profileData?.is_vip_member || false);
          setUserRole(profileData?.role || "customer");
        }

        const { data: vipData } = await supabase
          .from("vip_content")
          .select("*, creator_profile:profiles(*)");

        if (vipData) {
          setGalleryItems(
            vipData.filter((v: any) => v.is_public_gallery === true),
          );
          setVipItems(vipData.filter((v: any) => v.is_public_gallery !== true));
        }

        const { data } = await supabase
          .from("stories")
          .select("*, user_profile:profiles(*)")
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          setDbStories(data as Story[]);
        }
      } catch (err) {
        console.error("[Fetch Stories Error]", err);
      }
    };

    fetchStories();
  }, [isFocused]);

  // Combine instant session stories + DB stories
  const localStories = sessionStore.getStories();
  const allUserStories = [...localStories, ...dbStories];

  const handleCameraCapture = async () => {
    if (Platform.OS === "web") {
      window.alert(
        "Camera capture is only supported on native apps. Please use Upload from Device on web.",
      );
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      window.alert("Sorry, we need camera permissions to make this work!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setShowAddStoryModal(false);
      const asset = result.assets[0];
      // Reuse handleDeviceFileUpload logic but skip file input
      const mediaUrl = asset.uri;
      const isVideo = asset.type === "video";
      const userDisplayName = "Me";

      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;

        if (uploadDestination === "story") {
          const newStoryItem: Story = {
            id: `uploaded-story-${Date.now()}`,
            user_id: user?.id || "demo-user-id",
            media_url: mediaUrl,
            media_type: isVideo ? "video" : "image",
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            user_profile: { display_name: userDisplayName },
          };
          sessionStore.addStory(newStoryItem);
          setDbStories((prev) => [newStoryItem, ...prev]);
        } else {
          const newVipItem = {
            id: `uploaded-${uploadDestination}-${Date.now()}`,
            creator_id: user?.id || "demo-user-id",
            title: `My ${uploadDestination} post`,
            description: "",
            media_url: mediaUrl,
            media_type: isVideo ? "video" : "image",
            required_tier: uploadDestination === "vip" ? "vip" : "public",
            is_public_gallery: uploadDestination === "gallery",
            created_at: new Date().toISOString(),
            creator_profile: {
              display_name: userDisplayName,
              username: userDisplayName,
            },
          };
          if (uploadDestination === "gallery") {
            setGalleryItems((prev) => [newVipItem, ...prev]);
          } else {
            setVipItems((prev) => [newVipItem, ...prev]);
          }
        }
      } catch (err) {
        console.error("Camera upload failed", err);
      }
    }
  };

  const handleDeviceFileUpload = (event: any) => {
    const file = event.target?.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith("video");
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const mediaUrl = e.target.result as string;
          const { data: userData } = await supabase.auth.getUser();
          const user = userData?.user;
          const userDisplayName =
            user?.user_metadata?.display_name ||
            user?.user_metadata?.username ||
            user?.email?.split("@")[0] ||
            "My Story";

          if (uploadDestination === "story") {
            const newStoryItem: Story = {
              id: `uploaded-story-${Date.now()}`,
              user_id: user?.id || "demo-user-id",
              media_url: mediaUrl,
              media_type: isVideo ? "video" : "image",
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 86400000).toISOString(),
              user_profile: { display_name: userDisplayName },
            };
            sessionStore.addStory(newStoryItem);
            setDbStories((prev) => [newStoryItem, ...prev]);
          } else {
            // Upload to Gallery or VIP
            const newVipItem = {
              id: `uploaded-${uploadDestination}-${Date.now()}`,
              creator_id: user?.id || "demo-user-id",
              title: `My ${uploadDestination} post`,
              description: "",
              media_url: mediaUrl,
              media_type: isVideo ? "video" : "image",
              required_tier: uploadDestination === "vip" ? "vip" : "public",
              is_public_gallery: uploadDestination === "gallery",
              created_at: new Date().toISOString(),
              creator_profile: {
                display_name: userDisplayName,
                username: userDisplayName,
              },
            };
            if (uploadDestination === "gallery") {
              setGalleryItems((prev) => [newVipItem, ...prev]);
            } else {
              setVipItems((prev) => [newVipItem, ...prev]);
            }
          }

          if (user) {
            if (uploadDestination === "story") {
              await (supabase.from("stories") as any).insert({
                user_id: user.id,
                media_url: mediaUrl,
                media_type: isVideo ? "video" : "image",
              });
            } else {
              await (supabase.from("vip_content") as any).insert({
                creator_id: user.id,
                media_url: mediaUrl,
                media_type: isVideo ? "video" : "image",
                title: `My ${uploadDestination} post`,
                description: "",
                required_tier: uploadDestination === "vip" ? "vip" : "public",
                is_public_gallery: uploadDestination === "gallery",
              });
            }
          }

          setShowAddStoryModal(false);
          const msg = "New Snap Story added! 🔥 View it in full screen now.";
          if (Platform.OS === "web" && typeof window !== "undefined") {
            window.alert(`👻 New Story Posted!\n\n${msg}`);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Separate my stories from other creators' stories to avoid duplicate circles
  const myStories = allUserStories.filter(
    (s) =>
      s.user_id === currentUserId ||
      s.user_id === "demo-user-id" ||
      currentUserId === null,
  );

  const otherStories = allUserStories.filter(
    (s) =>
      s.user_id !== currentUserId &&
      s.user_id !== "demo-user-id" &&
      currentUserId !== null,
  );

  const openMyStory = () => {
    if (myStories.length > 0) {
      openStoryViewer(
        myStories.map((s) => ({
          id: s.id,
          media_url: s.media_url,
          media_type: s.media_type,
          user_profile: {
            display_name: s.user_profile?.display_name || "My Story",
          },
        })),
      );
    } else {
      setShowAddStoryModal(true);
    }
  };

  const openStoryReel = (friend: FriendStoryItem) => {
    openStoryViewer([
      {
        id: friend.id,
        media_url: friend.storyMedia,
        media_type: "image",
        user_profile: { display_name: friend.name },
      },
    ]);
  };

  const openDbStoryReel = (story: Story) => {
    openStoryViewer([
      {
        id: story.id,
        media_url: story.media_url,
        media_type: story.media_type,
        user_profile: {
          display_name:
            story.user_profile?.display_name ||
            story.user_profile?.username ||
            "Snap Creator",
        },
      },
    ]);
  };

  // Filter Discover content dynamically based on selected category
  const displayVipItems = vipItems.length > 0 ? vipItems : FOR_YOU;
  const filteredDiscover = displayVipItems;

  return (
    <SafeAreaView style={styles.container}>
      <SnapBar title="Discover" />

      {/* DEBUG TOGGLE UI FOR TESTING */}
      {Platform.OS === "web" && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "8px 16px",
            backgroundColor: "#1C1C1E",
            borderBottom: "1px solid #333",
          }}
        >
          <button
            type="button"
            onClick={() =>
              setUserRole(userRole === "creator" ? "customer" : "creator")
            }
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: userRole === "creator" ? "#00F2FE" : "#333",
              color: userRole === "creator" ? "#000" : "#FFF",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {userRole === "creator" ? "✅ Role: Creator" : "❌ Role: Customer"}
          </button>
          <button
            type="button"
            onClick={() => setIsVipMember(!isVipMember)}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: isVipMember ? "#FFD700" : "#333",
              color: isVipMember ? "#000" : "#FFF",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {isVipMember ? "✅ VIP Active" : "❌ VIP Inactive"}
          </button>
        </div>
      )}

      {/* On web: use native HTML scroll containers to fix iOS Safari touch blocking */}
      {/* On native: use React Native ScrollView */}
      {Platform.OS === "web" ? (
        <div
          style={{
            flex: 1,
            overflowY: "auto" as any,
            overflowX: "hidden" as any,
            WebkitOverflowScrolling: "touch" as any,
            paddingBottom: "100px",
          }}
        >
          {/* 1. Friends Stories Row */}
          <div
            style={{
              paddingLeft: "16px",
              paddingTop: "12px",
              paddingBottom: "4px",
            }}
          >
            <span
              style={{ color: "#FFF", fontSize: "17px", fontWeight: "bold" }}
            >
              Stories
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row" as any,
              overflowX: "auto" as any,
              WebkitOverflowScrolling: "touch" as any,
              paddingLeft: "16px",
              paddingBottom: "8px",
              gap: "16px",
            }}
          >
            {/* ADD STORY BUTTON */}
            <button
              type="button"
              onClick={() => setShowAddStoryModal(true)}
              style={{
                border: "none",
                background: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column" as any,
                alignItems: "center",
                cursor: "pointer",
                WebkitAppearance: "none" as any,
                appearance: "none" as any,
                touchAction: "manipulation",
                minWidth: "80px",
                flexShrink: 0,
              }}
            >
              <View style={[styles.avatarRing, styles.addStoryRing]}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                  }}
                  style={styles.friendAvatar}
                />
                <View style={styles.plusBadge}>
                  <Text style={styles.plusBadgeText}>＋</Text>
                </View>
              </View>
              <Text style={styles.myStoryName} numberOfLines={1}>
                Add Story
              </Text>
            </button>

            {/* MY STORY (IF EXISTS) */}
            {myStories.length > 0 && (
              <button
                type="button"
                onClick={() => openMyStory()}
                style={{
                  border: "none",
                  background: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column" as any,
                  alignItems: "center",
                  cursor: "pointer",
                  WebkitAppearance: "none" as any,
                  appearance: "none" as any,
                  touchAction: "manipulation",
                  minWidth: "80px",
                  flexShrink: 0,
                }}
              >
                <View style={[styles.avatarRing, styles.activeMyStoryRing]}>
                  <Image
                    source={{ uri: myStories[0].media_url }}
                    style={styles.friendAvatar}
                  />
                </View>
                <Text style={styles.myStoryName} numberOfLines={1}>
                  {`My Story (${myStories.length})`}
                </Text>
              </button>
            )}

            {/* OTHER CREATORS' POSTED STORIES */}
            {otherStories.map((story) => {
              const displayName =
                story.user_profile?.display_name ||
                story.user_profile?.username ||
                "Creator";
              return (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => openDbStoryReel(story)}
                  style={{
                    border: "none",
                    background: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column" as any,
                    alignItems: "center",
                    cursor: "pointer",
                    WebkitAppearance: "none" as any,
                    appearance: "none" as any,
                    touchAction: "manipulation",
                    minWidth: "80px",
                    flexShrink: 0,
                  }}
                >
                  <View style={[styles.avatarRing, styles.activeStoryRing]}>
                    <Image
                      source={{ uri: story.media_url }}
                      style={styles.friendAvatar}
                    />
                  </View>
                  <Text style={styles.friendName} numberOfLines={1}>
                    {displayName}
                  </Text>
                </button>
              );
            })}

            {/* DEMO FRIEND STORIES */}
            {FRIEND_STORIES.map((friend) => (
              <button
                key={friend.id}
                type="button"
                onClick={() => openStoryReel(friend)}
                style={{
                  border: "none",
                  background: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column" as any,
                  alignItems: "center",
                  cursor: "pointer",
                  WebkitAppearance: "none" as any,
                  appearance: "none" as any,
                  touchAction: "manipulation",
                  minWidth: "80px",
                  flexShrink: 0,
                }}
              >
                <View
                  style={[
                    styles.avatarRing,
                    friend.hasUnseen && styles.activeStoryRing,
                  ]}
                >
                  <Image
                    source={{ uri: friend.avatar }}
                    style={styles.friendAvatar}
                  />
                </View>
                <Text style={styles.friendName} numberOfLines={1}>
                  {friend.name}
                </Text>
              </button>
            ))}
          </div>

          {/* 2. Subscriptions Section */}
          <div
            style={{
              paddingLeft: "16px",
              paddingTop: "12px",
              paddingBottom: "4px",
            }}
          >
            <span
              style={{ color: "#FFF", fontSize: "17px", fontWeight: "bold" }}
            >
              Gallery
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row" as any,
              overflowX: "auto" as any,
              WebkitOverflowScrolling: "touch" as any,
              paddingLeft: "16px",
              paddingBottom: "8px",
              gap: "12px",
            }}
          >
            {(galleryItems.length > 0 ? galleryItems : SUBSCRIPTIONS).map(
              (sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    openStoryViewer([
                      {
                        id: sub.id,
                        media_url: sub.media_url || sub.image,
                        media_type: sub.media_type || "image",
                        user_profile: {
                          display_name:
                            sub.creator_profile?.username || sub.author,
                        },
                      },
                    ]);
                  }}
                  style={{
                    border: "none",
                    background: "none",
                    padding: 0,
                    margin: 0,
                    cursor: "pointer",
                    WebkitAppearance: "none" as any,
                    appearance: "none" as any,
                    touchAction: "manipulation",
                    width: "140px",
                    height: "200px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    backgroundColor: "#1C1C1E",
                    flexShrink: 0,
                    position: "relative" as any,
                  }}
                >
                  <Image
                    source={{ uri: sub.media_url || sub.image }}
                    style={styles.subImage}
                  />
                </button>
              ),
            )}
          </div>

          {/* 3. Category Filter Pill Bar */}
          <div
            style={{
              paddingLeft: "16px",
              paddingTop: "12px",
              paddingBottom: "4px",
            }}
          >
            <span
              style={{
                fontSize: "17px",
                fontWeight: "bold",
                color: "#FFD700",
              }}
            >
              👑 VIP Section
            </span>
          </div>

          {/* 4. Filtered "For You" Discover Grid */}
          <div
            style={{
              display: "flex",
              flexDirection: "row" as any,
              flexWrap: "wrap" as any,
              paddingLeft: "12px",
              paddingRight: "12px",
              justifyContent: "space-between",
              marginTop: "4px",
            }}
          >
            {filteredDiscover.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (!isVipMember) {
                    window.alert(
                      "👑 VIP Membership Required\n\nRedirecting to checkout...",
                    );
                    // trigger stripe checkout here or open VIP Modal
                    navigation.navigate("MainTabs", {
                      screen: "VipMembers",
                    } as any);
                    return;
                  }
                  openStoryViewer([
                    {
                      id: item.id,
                      media_url: item.media_url || item.image,
                      media_type: item.media_type || "image",
                      user_profile: {
                        display_name:
                          item.creator_profile?.username || item.publisher,
                      },
                    },
                  ]);
                }}
                style={{
                  border: "none",
                  background: "none",
                  padding: 0,
                  margin: 0,
                  cursor: "pointer",
                  WebkitAppearance: "none" as any,
                  appearance: "none" as any,
                  touchAction: "manipulation",
                  width: `${cardWidth}px`,
                  height: `${cardWidth * 1.5}px`,
                  borderRadius: "14px",
                  overflow: "hidden",
                  backgroundColor: "#1C1C1E",
                  marginBottom: "12px",
                  position: "relative" as any,
                }}
              >
                <Image
                  source={{ uri: item.media_url || item.image }}
                  style={[
                    styles.discoverImage,
                    !isVipMember &&
                      ({ opacity: 0.4, filter: "blur(8px)" } as any),
                  ]}
                />
                {!isVipMember && (
                  <View
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)" as any,
                    }}
                  >
                    <Text style={{ fontSize: 30 }}>🔒</Text>
                  </View>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Friends Stories Row */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Stories</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.friendsScroll}
          >
            {/* ADD STORY BUTTON */}
            <WebTouchable
              style={styles.friendItem}
              onPress={() => setShowAddStoryModal(true)}
            >
              <View style={[styles.avatarRing, styles.addStoryRing]}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                  }}
                  style={styles.friendAvatar}
                />
                <View style={styles.plusBadge}>
                  <Text style={styles.plusBadgeText}>＋</Text>
                </View>
              </View>
              <Text style={styles.myStoryName} numberOfLines={1}>
                Add Story
              </Text>
            </WebTouchable>

            {/* MY STORY (IF EXISTS) */}
            {myStories.length > 0 && (
              <WebTouchable style={styles.friendItem} onPress={openMyStory}>
                <View style={[styles.avatarRing, styles.activeMyStoryRing]}>
                  <Image
                    source={{ uri: myStories[0].media_url }}
                    style={styles.friendAvatar}
                  />
                </View>
                <Text style={styles.myStoryName} numberOfLines={1}>
                  {`My Story (${myStories.length})`}
                </Text>
              </WebTouchable>
            )}

            {otherStories.map((story) => {
              const displayName =
                story.user_profile?.display_name ||
                story.user_profile?.username ||
                "Creator";
              return (
                <WebTouchable
                  key={story.id}
                  style={styles.friendItem}
                  onPress={() => openDbStoryReel(story)}
                >
                  <View style={[styles.avatarRing, styles.activeStoryRing]}>
                    <Image
                      source={{ uri: story.media_url }}
                      style={styles.friendAvatar}
                    />
                  </View>
                  <Text style={styles.friendName} numberOfLines={1}>
                    {displayName}
                  </Text>
                </WebTouchable>
              );
            })}

            {FRIEND_STORIES.map((friend) => (
              <WebTouchable
                key={friend.id}
                style={styles.friendItem}
                onPress={() => openStoryReel(friend)}
              >
                <View
                  style={[
                    styles.avatarRing,
                    friend.hasUnseen && styles.activeStoryRing,
                  ]}
                >
                  <Image
                    source={{ uri: friend.avatar }}
                    style={styles.friendAvatar}
                  />
                </View>
                <Text style={styles.friendName} numberOfLines={1}>
                  {friend.name}
                </Text>
              </WebTouchable>
            ))}
          </ScrollView>

          {/* 2. Subscriptions Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gallery</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.subsScroll}
          >
            {(galleryItems.length > 0 ? galleryItems : SUBSCRIPTIONS).map(
              (sub) => (
                <WebTouchable
                  key={sub.id}
                  style={styles.subCard}
                  onPress={() => {
                    openStoryViewer([
                      {
                        id: sub.id,
                        media_url: sub.media_url || sub.image,
                        media_type: sub.media_type || "image",
                        user_profile: {
                          display_name:
                            sub.creator_profile?.username || sub.author,
                        },
                      },
                    ]);
                  }}
                >
                  <Image
                    source={{ uri: sub.media_url || sub.image }}
                    style={styles.subImage}
                  />
                </WebTouchable>
              ),
            )}
          </ScrollView>

          {/* 3. Category Filter Pill Bar */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: "#FFD700" }]}>
              👑 VIP Section
            </Text>
          </View>

          {/* 4. Filtered "For You" Discover Grid */}
          <View style={styles.discoverGrid}>
            {filteredDiscover.map((item) => (
              <WebTouchable
                key={item.id}
                style={styles.discoverCard}
                onPress={() => {
                  if (!isVipMember) {
                    // Trigger native checkout (e.g. RevenueCat or Stripe)
                    navigation.navigate("MainTabs", {
                      screen: "VipMembers",
                    } as any);
                    return;
                  }
                  openStoryViewer([
                    {
                      id: item.id,
                      media_url: item.media_url || item.image,
                      media_type: item.media_type || "image",
                      user_profile: {
                        display_name:
                          item.creator_profile?.username || item.publisher,
                      },
                    },
                  ]);
                }}
              >
                <Image
                  source={{ uri: item.media_url || item.image }}
                  style={[
                    styles.discoverImage,
                    !isVipMember && { opacity: 0.4 },
                  ]}
                  blurRadius={!isVipMember ? 10 : 0}
                />
                {!isVipMember && (
                  <View
                    style={{ position: "absolute", top: "40%", left: "45%" }}
                  >
                    <Text style={{ fontSize: 30 }}>🔒</Text>
                  </View>
                )}
              </WebTouchable>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Hidden File Picker Input for Device Photo/Video Upload */}
      {Platform.OS === "web" && (
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,video/*"
          style={{ display: "none" }}
          onChange={handleDeviceFileUpload}
        />
      )}

      {/* Story viewer is now rendered at the app root level via StoryViewerProvider */}

      {/* ADD NEW SNAP STORY SELECTION MODAL */}
      <Modal
        visible={showAddStoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddStoryModal(false)}
      >
        <View style={styles.addModalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>👻 Add Content</Text>

              <Pressable
                onPress={() => setShowAddStoryModal(false)}
                style={styles.addModalClose}
              >
                <Text style={styles.addModalCloseText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.addModalSubtitle}>
              Where do you want to post this content?
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginBottom: 16,
              }}
            >
              <Pressable
                onPress={() => setUploadDestination("story")}
                style={{
                  padding: 8,
                  borderBottomWidth: uploadDestination === "story" ? 2 : 0,
                  borderColor: "#00F2FE",
                }}
              >
                <Text
                  style={{
                    color: uploadDestination === "story" ? "#00F2FE" : "#888",
                    fontWeight: "bold",
                  }}
                >
                  Story (24h)
                </Text>
              </Pressable>
              {userRole === "creator" && (
                <>
                  <Pressable
                    onPress={() => setUploadDestination("gallery")}
                    style={{
                      padding: 8,
                      borderBottomWidth:
                        uploadDestination === "gallery" ? 2 : 0,
                      borderColor: "#00F2FE",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          uploadDestination === "gallery" ? "#00F2FE" : "#888",
                        fontWeight: "bold",
                      }}
                    >
                      Gallery
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setUploadDestination("vip")}
                    style={{
                      padding: 8,
                      borderBottomWidth: uploadDestination === "vip" ? 2 : 0,
                      borderColor: "#FFD700",
                    }}
                  >
                    <Text
                      style={{
                        color: uploadDestination === "vip" ? "#FFD700" : "#888",
                        fontWeight: "bold",
                      }}
                    >
                      VIP 🔒
                    </Text>
                  </Pressable>
                </>
              )}
            </View>


            <Pressable
              style={({ pressed }) => [
                styles.addOptionBtnPrimary,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => {
                if (Platform.OS === "web" && fileInputRef.current) {
                  fileInputRef.current.click();
                } else {
                  setShowAddStoryModal(false);
                  navigation.navigate("MainTabs", { screen: "Camera" });
                }
              }}
            >
              <Text style={styles.addOptionIcon}>📁</Text>
              <View>
                <Text style={styles.addOptionText}>Upload from Device</Text>
                <Text style={styles.addOptionSubtext}>
                  Select any photo or video
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  friendsScroll: {
    paddingLeft: 16,
  },
  friendItem: {
    alignItems: "center",
    marginRight: 16,
    width: 76,
  },
  avatarRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    padding: 3,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  activeStoryRing: {
    borderColor: "#9D4EDD",
  },
  activeMyStoryRing: {
    borderColor: "#FFFC00",
  },
  addStoryRing: {
    borderColor: "rgba(255, 255, 255, 0.4)",
    borderStyle: "dashed",
  },
  plusBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#00F2FE",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
  plusBadgeText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "900",
  },
  friendAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  friendName: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  myStoryName: {
    color: "#FFFC00",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 6,
    textAlign: "center",
  },
  subsScroll: {
    paddingLeft: 16,
  },
  subCard: {
    width: 140,
    height: 200,
    borderRadius: 14,
    marginRight: 12,
    overflow: "hidden",
    backgroundColor: "#1C1C1E",
  },
  subImage: {
    width: "100%",
    height: "100%",
  },
  subGradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  subAuthor: {
    color: "#FFFC00",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  subTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  discoverGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    justifyContent: "space-between",
    marginTop: 4,
  },
  discoverCard: {
    width: cardWidth,
    height: cardWidth * 1.5,
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    backgroundColor: "#1C1C1E",
  },
  discoverImage: {
    width: "100%",
    height: "100%",
  },
  discoverGradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  categoryBadge: {
    color: "#00F2FE",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },
  discoverTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: 18,
    marginBottom: 6,
  },
  publisherName: {
    color: "#A0A0B0",
    fontSize: 12,
  },
  addModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  addModalContent: {
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#FFFC00",
  },
  addModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addModalTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  addModalClose: {
    padding: 6,
  },
  addModalCloseText: {
    color: "#8E8E93",
    fontSize: 18,
    fontWeight: "bold",
  },
  addModalSubtitle: {
    color: "#8E8E93",
    fontSize: 13,
    marginBottom: 6,
  },
  addOptionBtnPrimary: {
    backgroundColor: "rgba(255, 252, 0, 0.18)",
    borderWidth: 1.5,
    borderColor: "#FFFC00",
    padding: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addOptionIcon: {
    fontSize: 24,
  },
  addOptionText: {
    color: "#FFFC00",
    fontSize: 15,
    fontWeight: "bold",
  },
  addOptionSubtext: {
    color: "#AAA",
    fontSize: 11,
    marginTop: 2,
  },
  addOptionBtnSecondary: {
    backgroundColor: "#2C2C2E",
    padding: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addOptionTextSecondary: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default StoriesScreen;
