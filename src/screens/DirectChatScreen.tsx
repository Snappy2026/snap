// ============================================================================
// DirectChatScreen Component
// 1-on-1 Real-time Text Chat with Supabase Realtime postgres_changes & Presence.
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { ChatMessage } from '../types/database';
import { supabase } from '../lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type DirectChatRouteProp = RouteProp<RootStackParamList, 'DirectChat'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DirectChatScreen: React.FC = () => {
  const route = useRoute<DirectChatRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { friendId, friendName, friendAvatar } = route.params;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Fetch initial 1-on-1 chat history
  const fetchMessages = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      setCurrentUserId(userId);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[DirectChat Error]', error.message);
      } else if (data && data.length > 0) {
        setMessages(data as ChatMessage[]);
      } else {
        // Fallback demo chat history
        setMessages([
          { id: 'm1', sender_id: friendId, recipient_id: userId, text_content: 'Hey! Did you check out the new snap?', created_at: new Date(Date.now() - 3600000).toISOString(), read_at: null },
          { id: 'm2', sender_id: userId, recipient_id: friendId, text_content: 'Yeah! Looks awesome 🔥', created_at: new Date(Date.now() - 1800000).toISOString(), read_at: null },
        ]);
      }
    } catch (err) {
      console.error('[DirectChat Error]', err);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Supabase Realtime Subscription for incoming text messages
    const setupRealtime = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const channel = supabase
        .channel(`chat_${userId}_${friendId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${userId}`,
          },
          (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
            if (payload.new && (payload.new as ChatMessage).sender_id === friendId) {
              setMessages((prev) => [...prev, payload.new as ChatMessage]);
            }
          }
        )
        .subscribe();

      // Realtime Typing Indicator
      const presenceChannel = supabase.channel(`presence_${friendId}`);
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const friendState = (Object.values(state).flat() as any[]).find((p: any) => p.userId === friendId);
          setIsFriendTyping(!!friendState?.isTyping);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(presenceChannel);
      };
    };

    setupRealtime();
  }, [friendId]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');

    const tempMsg: ChatMessage = {
      id: Date.now().toString(),
      sender_id: currentUserId || 'me',
      recipient_id: friendId,
      text_content: messageText,
      created_at: new Date().toISOString(),
      read_at: null,
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      if (currentUserId) {
        await (supabase.from('messages') as any).insert({
          sender_id: currentUserId,
          recipient_id: friendId,
          text_content: messageText,
        });
      }
    } catch (err) {
      console.error('[Send Message Error]', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <Image source={{ uri: friendAvatar }} style={styles.headerAvatar} />

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{friendName}</Text>
          {isFriendTyping ? (
            <Text style={styles.typingStatus}>typing...</Text>
          ) : (
            <Text style={styles.onlineStatus}>Active now</Text>
          )}
        </View>

        <TouchableOpacity style={styles.cameraQuickBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Camera' })}>
          <Text style={styles.cameraIcon}>📷</Text>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.chatArea}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMe = item.sender_id === currentUserId || item.sender_id === 'me';
            return (
              <View style={[styles.bubbleWrapper, isMe ? styles.myBubbleWrapper : styles.theirBubbleWrapper]}>
                <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                  <Text style={[styles.bubbleText, isMe ? styles.myBubbleText : styles.theirBubbleText]}>
                    {item.text_content}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Text Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Send a chat..."
            placeholderTextColor="#8E8E93"
            style={styles.textInput}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendBtnIcon}>🚀</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backBtn: {
    paddingRight: 12,
  },
  backText: {
    color: '#00F2FE',
    fontSize: 18,
    fontWeight: '600',
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  typingStatus: {
    color: '#FFFC00',
    fontSize: 12,
    fontStyle: 'italic',
  },
  onlineStatus: {
    color: '#34C759',
    fontSize: 12,
  },
  cameraQuickBtn: {
    padding: 6,
  },
  cameraIcon: {
    fontSize: 22,
  },
  chatArea: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  bubbleWrapper: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  myBubbleWrapper: {
    justifyContent: 'flex-end',
  },
  theirBubbleWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myBubble: {
    backgroundColor: '#00F2FE',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#1C1C1E',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myBubbleText: {
    color: '#000',
    fontWeight: '600',
  },
  theirBubbleText: {
    color: '#FFF',
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#000',
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#1C1C1E',
    borderRadius: 21,
    paddingHorizontal: 16,
    color: '#FFF',
    fontSize: 16,
  },
  sendBtn: {
    marginLeft: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#00F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnIcon: {
    fontSize: 18,
  },
});

export default DirectChatScreen;
