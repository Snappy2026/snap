import os

filepath = "src/screens/ChatFeedScreen.tsx"

new_code = """// ============================================================================
// ChatFeedScreen Component
// Real-time Adult+ Inbox Feed merging Snaps and Messages chronologically.
// ============================================================================

import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  ListRenderItemInfo,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { Snap, ChatMessage, Profile } from "../types/database";
import { supabase } from "../lib/supabase";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import SnapBar from "../components/SnapBar";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PresenceStatePayload {
  userId?: string;
  username?: string;
  isTyping?: boolean;
}

interface FeedItem {
  friendId: string;
  name: string;
  avatar: string;
  type: "image" | "video" | "chat";
  statusText: string;
  timeAgo: string;
  timestamp: number;
  isUnread: boolean;
  realSnap?: Snap;
}

export const ChatFeedScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const fetchInbox = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const userId = userData.user.id;
      setCurrentUserId(userId);

      // Fetch Snaps (sent and received)
      const { data: snaps, error: snapsError } = await supabase
        .from("snaps")
        .select(`*, sender_profile:profiles!snaps_sender_id_fkey(id, username, display_name, avatar_url), recipient_profile:profiles!snaps_recipient_id_fkey(id, username, display_name, avatar_url)`)
        .or(`recipient_id.eq.${userId},sender_id.eq.${userId}`);

      // Fetch Messages (sent and received)
      const { data: messages, error: msgsError } = await (supabase.from("messages") as any)
        .select(`*, sender_profile:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url), recipient_profile:profiles!messages_recipient_id_fkey(id, username, display_name, avatar_url)`)
        .or(`recipient_id.eq.${userId},sender_id.eq.${userId}`);

      if (snapsError) console.error("Snaps Error:", snapsError.message);
      if (msgsError) console.error("Messages Error:", msgsError.message);

      const itemsMap = new Map<string, FeedItem>();

      const processFriend = (
        friendId: string,
        friendProfile: any,
        itemTimestamp: number,
        type: "image" | "video" | "chat",
        statusText: string,
        isUnread: boolean,
        timeAgoStr: string,
        realSnap?: Snap
      ) => {
        const existing = itemsMap.get(friendId);
        if (!existing || existing.timestamp < itemTimestamp) {
          itemsMap.set(friendId, {
            friendId,
            name: friendProfile?.display_name || friendProfile?.username || "Adult+ Friend",
            avatar: friendProfile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            type,
            statusText,
            timeAgo: timeAgoStr,
            timestamp: itemTimestamp,
            isUnread,
            realSnap
          });
        }
      };

      // Process Snaps
      if (snaps) {
        (snaps as any[]).forEach(s => {
          const isSentByMe = s.sender_id === userId;
          const friendId = isSentByMe ? s.recipient_id : s.sender_id;
          const friendProfile = isSentByMe ? s.recipient_profile : s.sender_profile;
          
          const time = new Date(s.created_at).getTime();
          let statusText = "";
          let isUnread = false;

          if (isSentByMe) {
            statusText = s.viewed_at ? "Opened" : "Delivered";
          } else {
            statusText = s.viewed_at ? "Received" : `New ${s.media_type === "image" ? "Snap" : "Video"}`;
            isUnread = !s.viewed_at;
          }

          processFriend(friendId, friendProfile, time, s.media_type, statusText, isUnread, formatTimeAgo(s.created_at), s as Snap);
        });
      }

      // Process Messages
      if (messages) {
        (messages as any[]).forEach(m => {
          const isSentByMe = m.sender_id === userId;
          const friendId = isSentByMe ? m.recipient_id : m.sender_id;
          const friendProfile = isSentByMe ? m.recipient_profile : m.sender_profile;
          
          const time = new Date(m.created_at).getTime();
          let statusText = "";
          let isUnread = false;

          if (isSentByMe) {
            statusText = m.read_at ? "Opened" : "Delivered";
          } else {
            statusText = m.read_at ? "Received" : "New Chat";
            isUnread = !m.read_at;
          }

          processFriend(friendId, friendProfile, time, "chat", statusText, isUnread, formatTimeAgo(m.created_at));
        });
      }

      // Sort by timestamp descending
      const sorted = Array.from(itemsMap.values()).sort((a, b) => b.timestamp - a.timestamp);
      setFeedItems(sorted);

    } catch (err) {
      console.error("[ChatFeed Error]", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInbox();

    const setupRealtimeSubscription = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const snapsChannel = supabase
        .channel("realtime_snaps_inbox")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "snaps", filter: `recipient_id=eq.${userData.user.id}` },
          () => fetchInbox()
        )
        .subscribe();

      const messagesChannel = supabase
        .channel("realtime_messages_inbox")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${userData.user.id}` },
          () => fetchInbox()
        )
        .subscribe();

      const typingChannel = supabase.channel("chat_presence");
      typingChannel
        .on("presence", { event: "sync" }, () => {
          const state = typingChannel.presenceState<PresenceStatePayload>();
          const activeTyping: string[] = [];
          Object.values(state).forEach((presences) => {
            presences.forEach((p) => {
              if (p.isTyping && p.userId !== userData.user.id) {
                activeTyping.push(p.username || "A friend");
              }
            });
          });
          setTypingUsers(activeTyping);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(snapsChannel);
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(typingChannel);
      };
    };

    setupRealtimeSubscription();
  }, []);

  const handleRowPress = (item: FeedItem) => {
    if (item.isUnread && item.realSnap) {
      navigation.navigate("SnapViewer", { snap: item.realSnap });
    } else {
      navigation.navigate("DirectChat", {
        friendId: item.friendId,
        friendName: item.name,
        friendAvatar: item.avatar,
      });
    }
  };

  const renderItem = ({ item }: ListRenderItemInfo<FeedItem>) => {
    let iconBg = "#FF3B30";
    if (item.type === "video") iconBg = "#9D4EDD";
    if (item.type === "chat") iconBg = "#00F2FE";

    return (
      <TouchableOpacity
        style={styles.snapRow}
        onPress={() => handleRowPress(item)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.avatar }} style={styles.avatar} />

        <View style={styles.snapDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.senderTitle}>{item.name}</Text>
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusSquare,
                {
                  backgroundColor: item.isUnread ? iconBg : "transparent",
                  borderColor: iconBg,
                },
              ]}
            />
            <Text
              style={[
                styles.statusSubtitle,
                item.isUnread && styles.unreadStatusSubtitle,
              ]}
            >
              {item.statusText} • {item.timeAgo}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.cameraIconBtn}
          onPress={() => navigation.navigate("MainTabs", { screen: "Camera" })}
        >
          <Text style={styles.cameraEmoji}>📷</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <SnapBar title="Inbox" />

      {typingUsers.length > 0 && (
        <View style={styles.typingBanner}>
          <Text style={styles.typingIndicatorText}>
            ✍️ {typingUsers.join(", ")} is typing...
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : feedItems.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={{color: '#999'}}>No messages yet. Add a friend to start chatting!</Text>
        </View>
      ) : (
        <FlatList
          data={feedItems}
          keyExtractor={(item) => item.friendId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchInbox();
              }}
              tintColor="#D4AF37"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  typingBanner: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.3)",
  },
  typingIndicatorText: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 100,
  },
  snapRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
    backgroundColor: "#1C1C1E",
  },
  snapDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  senderTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 2,
    marginRight: 8,
  },
  statusSubtitle: {
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "500",
  },
  unreadStatusSubtitle: {
    color: "#FFF",
    fontWeight: "700",
  },
  cameraIconBtn: {
    padding: 8,
  },
  cameraEmoji: {
    fontSize: 24,
  },
});
"""

with open(filepath, 'w') as f:
    f.write(new_code)
print("ChatFeedScreen.tsx has been updated!")
