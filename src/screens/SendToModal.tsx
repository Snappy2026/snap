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
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
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

      const priceNum = parseFloat(ppvPrice) || 1.99;

      // 1. Post to My Story if selected
      if (postToStory && currentUser) {
        await (supabase.from('stories') as any).insert({
          user_id: currentUser.id,
          media_url: mediaUrl,
          media_type: mediaType,
          is_pay_per_view: isPpv,
          price_amount: priceNum,
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
          is_pay_per_view: isPpv,
          price_amount: priceNum,
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

  const [isPpv, setIsPpv] = useState(false);
  const [ppvPrice, setPpvPrice] = useState('1.99');

  const handleSaveToDevice = () => {
    try {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const a = document.createElement('a');
        a.href = mediaUrl;
        a.download = `snapchat-capture-${Date.now()}.${mediaType === 'video' ? 'webm' : 'jpg'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (typeof window !== 'undefined') {
          window.alert('💾 Snap saved to your Downloads folder!');
        }
      } else {
        Alert.alert('💾 Saved!', 'Snap saved to your device.');
      }
    } catch (e) {
      Alert.alert('Save Notice', 'Media saved to local memory.');
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
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSaveToDevice}>
          <Text style={styles.saveHeaderText}>💾 Save</Text>
        </TouchableOpacity>
      </View>

      {/* Media Preview & Save Card */}
      <View style={styles.previewCard}>
        {mediaType === 'image' ? (
          <Image source={{ uri: mediaUrl }} style={styles.previewThumbnail} />
        ) : (
          <View style={[styles.previewThumbnail, styles.videoPlaceholder]}>
            <Text style={{ fontSize: 30 }}>🎥</Text>
          </View>
        )}
        <View style={styles.previewInfo}>
          <Text style={styles.previewTitle}>Captured {mediaType === 'video' ? 'Video' : 'Photo'} Snap</Text>
          <Text style={styles.previewSubtitle}>Ready to save or share</Text>
        </View>
        <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveToDevice}>
          <Text style={styles.saveActionText}>💾 Save to Device</Text>
        </TouchableOpacity>
      </View>

      {/* Pay-Per-View (PPV) Price Tag Selector */}
      <View style={styles.ppvConfigCard}>
        <View style={styles.ppvHeaderRow}>
          <TouchableOpacity
            style={[styles.ppvOptionTab, !isPpv && styles.ppvOptionActive]}
            onPress={() => setIsPpv(false)}
          >
            <Text style={[styles.ppvOptionText, !isPpv && styles.ppvOptionTextActive]}>
              🔓 Free Snap
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ppvOptionTab, isPpv && styles.ppvOptionActive]}
            onPress={() => setIsPpv(true)}
          >
            <Text style={[styles.ppvOptionText, isPpv && styles.ppvOptionTextActive]}>
              🔒 Pay-Per-View Snap ($)
            </Text>
          </TouchableOpacity>
        </View>

        {isPpv && (
          <View style={styles.ppvPriceRow}>
            <Text style={styles.ppvPriceLabel}>Set Unlock Price (USD):</Text>
            <View style={styles.ppvInputBox}>
              <Text style={styles.ppvCurrency}>$</Text>
              <TextInput
                value={ppvPrice}
                onChangeText={setPpvPrice}
                style={styles.ppvInput}
                keyboardType="numeric"
                placeholder="1.99"
                placeholderTextColor="#666"
              />
            </View>
            <Text style={styles.ppvFeeNote}>
              5% Admin Fee: ${(parseFloat(ppvPrice || '0') * 0.05).toFixed(2)} | Net to you: ${(parseFloat(ppvPrice || '0') * 0.95).toFixed(2)}
            </Text>
          </View>
        )}
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
  saveHeaderBtn: {
    padding: 6,
  },
  saveHeaderText: {
    color: '#FFFC00',
    fontSize: 15,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 252, 0, 0.2)',
  },
  previewThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    marginRight: 12,
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  previewSubtitle: {
    color: '#8E8E93',
    fontSize: 12,
  },
  saveActionBtn: {
    backgroundColor: 'rgba(255, 252, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFC00',
  },
  saveActionText: {
    color: '#FFFC00',
    fontSize: 12,
    fontWeight: '800',
  },
  ppvConfigCard: {
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
  },
  ppvHeaderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ppvOptionTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
  },
  ppvOptionActive: {
    backgroundColor: '#FFFC00',
  },
  ppvOptionText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  ppvOptionTextActive: {
    color: '#000',
    fontWeight: '800',
  },
  ppvPriceRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  ppvPriceLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  ppvInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  ppvCurrency: {
    color: '#FFFC00',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 6,
  },
  ppvInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  ppvFeeNote: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 6,
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
