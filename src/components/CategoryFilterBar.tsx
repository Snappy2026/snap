// ============================================================================
// CategoryFilterBar Component
// Interactive category filter pill bar for Discover stories feed.
// ============================================================================

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';

export interface DiscoverCategory {
  id: string;
  name: string;
  badge: string;
}

export const DISCOVER_CATEGORIES: DiscoverCategory[] = [
  { id: 'ALL', name: 'All', badge: '🔥' },
  { id: 'SCIENCE', name: 'Science', badge: '🚀' },
  { id: 'AUTO', name: 'Cars & Auto', badge: '🏎️' },
  { id: 'GAMING', name: 'Gaming', badge: '🎮' },
  { id: 'LIFESTYLE', name: 'Lifestyle', badge: '✨' },
  { id: 'TECH', name: 'Technology', badge: '🤖' },
  { id: 'FOOD', name: 'Food & Travel', badge: '🍜' },
];

interface CategoryFilterBarProps {
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  selectedCategoryId,
  onSelectCategory,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {DISCOVER_CATEGORIES.map((cat) => {
          const isSelected = cat.id === selectedCategoryId;
          return (
            <Pressable
              key={cat.id}
              style={({ pressed }) => [styles.pill, isSelected && styles.pillActive, pressed && { opacity: 0.8 }]}
              onPress={() => onSelectCategory(cat.id)}
            >
              <Text style={styles.badgeText}>{cat.badge}</Text>
              <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pillActive: {
    backgroundColor: '#FFFC00', // Snapchat Yellow Accent
    borderColor: '#FFFC00',
  },
  badgeText: {
    fontSize: 14,
    marginRight: 6,
  },
  pillText: {
    color: '#A0A0B0',
    fontSize: 13,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#000',
  },
});

export default CategoryFilterBar;
