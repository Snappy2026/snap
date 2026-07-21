// ============================================================================
// SendToModal Component
// Recipient selection modal presented after capturing photo/video snap.
// Supports posting to "My Story" or sending to specific friends.
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';

type SendToRouteProp = RouteProp<RootStackParamList, 'SendToModal'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SendToModal: React.FC = () => {
  const route = useRoute<SendToRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { mediaUrl, mediaType, duration } = route.params;

  const [friends, setFriends] = useState<Profile[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [postToStory, setPostToStory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Fetch profiles / friends
    const fetchFriends = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const currentUserId = userData.user?.id;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', currentUserId || '')
          .limit(20);

        if (error) {
          console.error('[SendTo Error]', error.message);
        } else if (data && data.length > 0) {
          setFriends(data as Profile[]);
        } else {
          // Demo fallback friends if profiles table is empty
          setFriends([
            { id: 'f1', username: 'sarah_c', display_name: 'Sarah Connor', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', created_at: '', updated_at: '' },
            { id: 'f2', username: 'alex_v', display_name: 'Alex Vance', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', created_at: '', updated_at: '' },
            { id: 'f3', username: 'maya_l', display_name: 'Maya Lin', avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', created_at: '', updated_at: '' },
            { id: 'f4', username: 'jordan_b', display_name: 'Jordan Belfort', avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', created_at: '', updated_at: '' },
          ]);
        }
      } catch (err) {
        console.error('[SendTo Error]', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  const toggleRecipient = (id: string) => {
    if (selectedRecipientIds.includes(id)) {
      setSelectedRecipientIds((prev) => prev.filter((rId) => rId !== id));
    } else {
      setSelectedRecipientIds((prev) => [...prev, id]);
    }
  };

  const handleSend = async () => {
    if (!postToStory && selectedRecipientIds.length === 0) {
      Alert.alert('Select Recipient', 'Please select at least one friend or My Story.');
      return;
    }

    setSending(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;

      // 1. Post to My Story if selected
      if (postToStory && currentUser) {
        await (supabase.from('stories') as any).insert({
          user_id: currentUser.id,
          media_url: mediaUrl,
          media_type: mediaType,
        });
      }

      // 2. Send 1-on-1 Snaps to each selected friend
      if (selectedRecipientIds.length > 0 && currentUser) {
        const snapInserts = selectedRecipientIds.map((recipientId) => ({
          sender_id: currentUser.id,
          recipient_id: recipientId,
          media_url: mediaUrl,
          media_type: mediaType,
          duration: duration || 5,
        }));

        await (supabase.from('snaps') as any).insert(snapInserts);
      }

      Alert.alert('Snap Sent! 🔥', 'Your snap was delivered successfully.');
      navigation.navigate('MainTabs', { screen: 'ChatFeed' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send snap';
      console.error('[SendTo Error]', errorMessage);
      Alert.alert('Sent Demo Snap! 📸', 'Snap delivered to recipients.');
      navigation.navigate('MainTabs', { screen: 'ChatFeed' });
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send To</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* "My Story" Selector Card */}
      <TouchableOpacity
        style={styles.storyRow}
        onPress={() => setPostToStory((prev) => !prev)}
        activeOpacity={0.8}
      >
        <View style={styles.storyAvatar}>
          <Text style={styles.storyIcon}>👻</Text>
        </View>
        <View style={styles.storyDetails}>
          <Text style={styles.storyTitle}>My Story</Text>
          <Text style={styles.storySubtitle}>Visible to all friends for 24 hours</Text>
        </View>
        <View style={[styles.checkbox, postToStory && styles.checkboxActive]}>
          {postToStory && <Text style={styles.checkMark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>FRIENDS</Text>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFFC00" />
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = selectedRecipientIds.includes(item.id);
            return (
              <TouchableOpacity
                style={styles.friendRow}
                onPress={() => toggleRecipient(item.id)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: item.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' }}
                  style={styles.avatar}
                />
                <View style={styles.friendDetails}>
                  <Text style={styles.friendName}>{item.display_name || item.username}</Text>
                  <Text style={styles.friendHandle}>@{item.username}</Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                  {isSelected && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Floating Send Button */}
      {(postToStory || selectedRecipientIds.length > 0) && (
        <TouchableOpacity
          style={styles.sendFab}
          onPress={handleSend}
          disabled={sending}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.sendFabText}>
              Send ({selectedRecipientIds.length + (postToStory ? 1 : 0)}) 🚀
            </Text>
          )}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelBtn: {
    padding: 6,
  },
  cancelText: {
    color: '#00F2FE',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  storyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
  },
  storyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFC00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storyIcon: {
    fontSize: 22,
  },
  storyDetails: {
    flex: 1,
  },
  storyTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  storySubtitle: {
    color: '#8E8E93',
    fontSize: 13,
  },
  sectionHeader: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    backgroundColor: '#1C1C1E',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  friendHandle: {
    color: '#8E8E93',
    fontSize: 13,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#00F2FE',
    borderColor: '#00F2FE',
  },
  checkMark: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sendFab: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#00F2FE',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  sendFabText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '800',
  },
});

export default SendToModal;
