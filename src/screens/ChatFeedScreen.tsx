// ============================================================================
// ChatFeedScreen Component
// Real-time Snapchat Inbox Feed with SnapBar header, Snap Streaks (🔥 42),
// unread indicators, and 1-on-1 DirectChat screen navigation.
// ============================================================================

import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Snap } from '../types/database';
import { supabase } from '../lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import SnapBar from '../components/SnapBar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PresenceStatePayload {
  userId?: string;
  username?: string;
  isTyping?: boolean;
}

interface DemoChatItem {
  id: string;
  name: string;
  avatar: string;
  snapType: 'image' | 'video' | 'chat';
  statusText: string;
  timeAgo: string;
  streakCount?: number;
  emojiReaction?: string;
  isUnread: boolean;
  realSnap?: Snap;
}

const DEMO_FRIENDS: DemoChatItem[] = [
  {
    id: 'demo-1',
    name: 'Sarah Connor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    snapType: 'image',
    statusText: 'New Snap',
    timeAgo: '2m',
    streakCount: 42,
    emojiReaction: '🔥',
    isUnread: true,
  },
  {
    id: 'demo-2',
    name: 'Alex Vance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    snapType: 'video',
    statusText: 'New Video Snap',
    timeAgo: '15m',
    streakCount: 18,
    emojiReaction: '😊',
    isUnread: true,
  },
  {
    id: 'demo-3',
    name: 'Maya Lin',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    snapType: 'chat',
    statusText: 'Opened • 1h ago',
    timeAgo: '1h',
    streakCount: 95,
    emojiReaction: '💛',
    isUnread: false,
  },
  {
    id: 'demo-4',
    name: 'Jordan Belfort',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    snapType: 'image',
    statusText: 'Received • 3h ago',
    timeAgo: '3h',
    streakCount: 7,
    emojiReaction: '🔥',
    isUnread: false,
  },
];

export const ChatFeedScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [realSnaps, setRealSnaps] = useState<Snap[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Fetch initial unviewed snaps addressed to current user from Supabase
  const fetchSnaps = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data, error } = await supabase
        .from('snaps')
        .select(`
          *,
          sender_profile:profiles!snaps_sender_id_fkey(username, display_name, avatar_url)
        `)
        .eq('recipient_id', userData.user.id)
        .is('viewed_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ChatFeed Error]', error.message);
      } else if (data) {
        setRealSnaps(data as Snap[]);
      }
    } catch (err) {
      console.error('[ChatFeed Error]', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSnaps();

    // Supabase Realtime Subscription for incoming snaps
    const setupRealtimeSubscription = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const channel = supabase
        .channel('realtime_snaps_inbox')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'snaps',
            filter: `recipient_id=eq.${userData.user.id}`,
          },
          (payload: RealtimePostgresChangesPayload<Snap>) => {
            console.log('[Realtime] New Snap Received:', payload.new);
            fetchSnaps();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'snaps',
            filter: `recipient_id=eq.${userData.user.id}`,
          },
          (payload: RealtimePostgresChangesPayload<Snap>) => {
            const oldRecord = payload.old as { id?: string };
            if (oldRecord && oldRecord.id) {
              setRealSnaps((prev) => prev.filter((s) => s.id !== oldRecord.id));
            }
          }
        )
        .subscribe();

      // Realtime Typing Status Presence Channel
      const typingChannel = supabase.channel('chat_presence');
      typingChannel
        .on('presence', { event: 'sync' }, () => {
          const state = typingChannel.presenceState<PresenceStatePayload>();
          const activeTyping: string[] = [];
          Object.values(state).forEach((presences) => {
            presences.forEach((p) => {
              if (p.isTyping && p.userId !== userData.user.id) {
                activeTyping.push(p.username || 'A friend');
              }
            });
          });
          setTypingUsers(activeTyping);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(typingChannel);
      };
    };

    setupRealtimeSubscription();
  }, []);

  const displayItems: DemoChatItem[] = [
    ...realSnaps.map((s) => ({
      id: s.id,
      name: s.sender_profile?.display_name || s.sender_profile?.username || 'Snapchat Friend',
      avatar: s.sender_profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      snapType: s.media_type,
      statusText: `New ${s.media_type === 'image' ? 'Snap' : 'Video'}`,
      timeAgo: 'Now',
      streakCount: 24,
      emojiReaction: '🔥',
      isUnread: true,
      realSnap: s,
    })),
    ...DEMO_FRIENDS,
  ];

  const handleRowPress = (item: DemoChatItem) => {
    if (item.isUnread) {
      if (item.realSnap) {
        navigation.navigate('SnapViewer', { snap: item.realSnap });
      } else {
        navigation.navigate('SnapViewer', {
          snap: {
            id: item.id,
            sender_id: 'demo-sender',
            recipient_id: 'demo-user',
            media_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
            media_type: item.snapType === 'video' ? 'video' : 'image',
            duration: 5,
            viewed_at: null,
            created_at: new Date().toISOString(),
            sender_profile: { display_name: item.name },
          },
        });
      }
    } else {
      // Open 1-on-1 Direct Text Chat for opened snaps/conversations
      navigation.navigate('DirectChat', {
        friendId: item.id,
        friendName: item.name,
        friendAvatar: item.avatar,
      });
    }
  };

  const renderItem = ({ item }: ListRenderItemInfo<DemoChatItem>) => {
    let iconBg = '#FF3B30';
    if (item.snapType === 'video') iconBg = '#9D4EDD';
    if (item.snapType === 'chat') iconBg = '#00F2FE';

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
            {item.streakCount && (
              <Text style={styles.streakText}>
                {item.streakCount} {item.emojiReaction}
              </Text>
            )}
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusSquare,
                { backgroundColor: item.isUnread ? iconBg : 'transparent', borderColor: iconBg },
              ]}
            />
            <Text style={[styles.statusSubtitle, item.isUnread && styles.unreadStatusSubtitle]}>
              {item.statusText} • {item.timeAgo}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.cameraIconBtn}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Camera' })}
        >
          <Text style={styles.cameraEmoji}>📷</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <SnapBar
        title="Chat"
      />

      {typingUsers.length > 0 && (
        <View style={styles.typingBanner}>
          <Text style={styles.typingIndicatorText}>
            ✍️ {typingUsers.join(', ')} is typing...
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFFC00" />
        </View>
      ) : (
        <FlatList
          data={displayItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchSnaps();
              }}
              tintColor="#FFFC00"
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
    backgroundColor: '#000',
  },
  typingBanner: {
    backgroundColor: 'rgba(255, 252, 0, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 252, 0, 0.3)',
  },
  typingIndicatorText: {
    color: '#FFFC00',
    fontSize: 13,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  snapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
    backgroundColor: '#1C1C1E',
  },
  snapDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    marginRight: 6,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusSquare: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 2,
    marginRight: 6,
  },
  statusSubtitle: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  unreadStatusSubtitle: {
    color: '#FFF',
    fontWeight: '700',
  },
  cameraIconBtn: {
    padding: 8,
  },
  cameraEmoji: {
    fontSize: 20,
    opacity: 0.6,
  },
});

export default ChatFeedScreen;
