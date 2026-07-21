// ============================================================================
// StoriesScreen Component (Discover & Stories)
// Integrated CategoryFilterBar, Friends Stories Row, Subscriptions Carousel,
// and dynamic category filtering for the Discover Grid.
// ============================================================================

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import SnapBar from '../components/SnapBar';
import CategoryFilterBar from '../components/CategoryFilterBar';

const { width } = Dimensions.get('window');
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
  { id: '1', name: 'Sarah', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', hasUnseen: true, storyMedia: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800' },
  { id: '2', name: 'Alex', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', hasUnseen: true, storyMedia: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800' },
  { id: '3', name: 'Maya', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', hasUnseen: false, storyMedia: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800' },
  { id: '4', name: 'Jordan', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', hasUnseen: true, storyMedia: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800' },
  { id: '5', name: 'Emma', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', hasUnseen: false, storyMedia: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800' },
];

const SUBSCRIPTIONS: Subscription[] = [
  {
    id: 's1',
    title: '10 Mind-Blowing AI Innovations of 2026',
    author: 'Tech Daily',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
  },
  {
    id: 's2',
    title: 'Secret Street Food Spots in Tokyo 🍜',
    author: 'Foodie Travel',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400',
  },
  {
    id: 's3',
    title: 'Ultimate 15-Min Workout Routine',
    author: 'FitLife',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400',
  },
];

const FOR_YOU: DiscoverItem[] = [
  {
    id: 'f1',
    title: 'What Happens When You Fly Through Saturn Rings?',
    publisher: 'Cosmos Mag',
    category: 'SCIENCE',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
  },
  {
    id: 'f2',
    title: 'Inside the World Most Exclusive Cyber Supercars',
    publisher: 'Motor Trend',
    category: 'AUTO',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400',
  },
  {
    id: 'f3',
    title: 'Next Gen Gaming Specs & Unreal Engine 5.5',
    publisher: 'IGN Snap',
    category: 'GAMING',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400',
  },
  {
    id: 'f4',
    title: '5 Aesthetic Room Makeovers You Can Do Under $100',
    publisher: 'Design Digest',
    category: 'LIFESTYLE',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400',
  },
  {
    id: 'f5',
    title: 'Quantum Computing Break-Through in Silicon Valley',
    publisher: 'Tech Crunch',
    category: 'TECH',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
  },
  {
    id: 'f6',
    title: 'Top 10 Hidden Ramen Joints in Kyoto',
    publisher: 'Food & Wine',
    category: 'FOOD',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
  },
];

export const StoriesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const openStoryReel = (friend: FriendStoryItem) => {
    navigation.navigate('StoryViewer', {
      stories: [
        {
          id: friend.id,
          user_id: friend.id,
          media_url: friend.storyMedia,
          media_type: 'image',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          user_profile: { display_name: friend.name },
        },
      ],
    });
  };

  // Filter Discover content dynamically based on selected category
  const filteredDiscover = FOR_YOU.filter(
    (item) => selectedCategory === 'ALL' || item.category === selectedCategory
  );

  return (
    <SafeAreaView style={styles.container}>
      <SnapBar title="Discover" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Friends Stories Row */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Friends</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsScroll}>
          {FRIEND_STORIES.map((friend) => (
            <TouchableOpacity
              key={friend.id}
              style={styles.friendItem}
              onPress={() => openStoryReel(friend)}
              activeOpacity={0.8}
            >
              <View style={[styles.avatarRing, friend.hasUnseen && styles.activeStoryRing]}>
                <Image source={{ uri: friend.avatar }} style={styles.friendAvatar} />
              </View>
              <Text style={styles.friendName} numberOfLines={1}>
                {friend.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 2. Subscriptions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Subscriptions</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subsScroll}>
          {SUBSCRIPTIONS.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              style={styles.subCard}
              onPress={() =>
                navigation.navigate('StoryViewer', {
                  stories: [
                    {
                      id: sub.id,
                      user_id: sub.id,
                      media_url: sub.image,
                      media_type: 'image',
                      created_at: new Date().toISOString(),
                      expires_at: new Date(Date.now() + 86400000).toISOString(),
                      user_profile: { display_name: sub.author },
                    },
                  ],
                })
              }
              activeOpacity={0.85}
            >
              <Image source={{ uri: sub.image }} style={styles.subImage} />
              <View style={styles.subGradientOverlay}>
                <Text style={styles.subAuthor}>{sub.author}</Text>
                <Text style={styles.subTitle} numberOfLines={2}>
                  {sub.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 3. Category Filter Pill Bar */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>For You</Text>
        </View>

        <CategoryFilterBar
          selectedCategoryId={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* 4. Filtered "For You" Discover Grid */}
        <View style={styles.discoverGrid}>
          {filteredDiscover.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.discoverCard}
              onPress={() =>
                navigation.navigate('StoryViewer', {
                  stories: [
                    {
                      id: item.id,
                      user_id: item.id,
                      media_url: item.image,
                      media_type: 'image',
                      created_at: new Date().toISOString(),
                      expires_at: new Date(Date.now() + 86400000).toISOString(),
                      user_profile: { display_name: item.publisher },
                    },
                  ],
                })
              }
              activeOpacity={0.85}
            >
              <Image source={{ uri: item.image }} style={styles.discoverImage} />
              <View style={styles.discoverGradientOverlay}>
                <Text style={styles.categoryBadge}>{item.category}</Text>
                <Text style={styles.discoverTitle} numberOfLines={3}>
                  {item.title}
                </Text>
                <Text style={styles.publisherName}>{item.publisher}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  friendsScroll: {
    paddingLeft: 16,
  },
  friendItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 76,
  },
  avatarRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    padding: 3,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStoryRing: {
    borderColor: '#9D4EDD',
  },
  friendAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  friendName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  subsScroll: {
    paddingLeft: 16,
  },
  subCard: {
    width: 140,
    height: 200,
    borderRadius: 14,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
  },
  subImage: {
    width: '100%',
    height: '100%',
  },
  subGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  subAuthor: {
    color: '#FFFC00',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  subTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  discoverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    marginTop: 4,
  },
  discoverCard: {
    width: cardWidth,
    height: cardWidth * 1.5,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
  },
  discoverImage: {
    width: '100%',
    height: '100%',
  },
  discoverGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  categoryBadge: {
    color: '#00F2FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  discoverTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
    marginBottom: 6,
  },
  publisherName: {
    color: '#A0A0B0',
    fontSize: 12,
  },
});

export default StoriesScreen;
