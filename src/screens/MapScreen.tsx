// ============================================================================
// MapScreen Component
// Interactive Snapchat Snap Map featuring Bitmoji friend pins, real-time location tags,
// and vibrant dark-mode map UI design matching Snapchat Mobile UI.
// ============================================================================

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import SnapBar from '../components/SnapBar';

const { width, height } = Dimensions.get('window');

interface MapFriend {
  id: string;
  name: string;
  avatar: string;
  location: string;
  timeAgo: string;
  topPct: string;
  leftPct: string;
}

const MAP_FRIENDS: MapFriend[] = [
  { id: '1', name: 'Sarah C.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', location: 'London, UK', timeAgo: '2m ago', topPct: '32%', leftPct: '45%' },
  { id: '2', name: 'Alex V.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', location: 'Soho Coffee', timeAgo: '15m ago', topPct: '55%', leftPct: '28%' },
  { id: '3', name: 'Elena R.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', location: 'Hyde Park', timeAgo: 'Just now', topPct: '42%', leftPct: '68%' },
  { id: '4', name: 'Jordan B.', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', location: 'Canary Wharf', timeAgo: '1h ago', topPct: '65%', leftPct: '75%' },
];

export const MapScreen: React.FC = () => {
  const [selectedFriend, setSelectedFriend] = useState<MapFriend | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <SnapBar title="Snap Map" />

      {/* Map Viewport Area */}
      <View style={styles.mapContainer}>
        {/* Dark Grid Vector Map Graphic */}
        <View style={styles.mapGraphic}>
          <Text style={styles.watermark}>📍 London, United Kingdom</Text>

          {/* Friend Bitmoji Pins on Map */}
          {MAP_FRIENDS.map((friend) => (
            <TouchableOpacity
              key={friend.id}
              style={[styles.pinContainer, { top: friend.topPct as any, left: friend.leftPct as any }]}
              onPress={() => setSelectedFriend(friend)}
              activeOpacity={0.8}
            >
              <View style={styles.pinBubble}>
                <Image source={{ uri: friend.avatar }} style={styles.pinAvatar} />
                <View style={styles.onlineBadge} />
              </View>
              <View style={styles.pinTag}>
                <Text style={styles.pinName}>{friend.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected Friend Location Card */}
        {selectedFriend && (
          <View style={styles.locationCard}>
            <Image source={{ uri: selectedFriend.avatar }} style={styles.cardAvatar} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{selectedFriend.name}</Text>
              <Text style={styles.cardLoc}>📍 {selectedFriend.location} • {selectedFriend.timeAgo}</Text>
            </View>
            <TouchableOpacity style={styles.closeCardBtn} onPress={() => setSelectedFriend(null)}>
              <Text style={styles.closeCardText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A14',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapGraphic: {
    flex: 1,
    backgroundColor: '#12131F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermark: {
    position: 'absolute',
    top: 20,
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontWeight: '800',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pinContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1C1C1E',
    borderWidth: 2.5,
    borderColor: '#FFFC00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFFC00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  pinAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderWidth: 1.5,
    borderColor: '#000',
  },
  pinTag: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pinName: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  locationCard: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFC00',
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardLoc: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  closeCardBtn: {
    padding: 6,
  },
  closeCardText: {
    color: '#8E8E93',
    fontSize: 16,
  },
});

export default MapScreen;
