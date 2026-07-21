// ============================================================================
// LensCarousel Component
// Interactive AR Lenses & Filters selector overlay for the Snapchat camera view.
// ============================================================================

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export interface ARLens {
  id: string;
  name: string;
  icon: string;
  filterOverlay?: string;
  topBadgeText?: string;
}

const LENSES: ARLens[] = [
  { id: 'none', name: 'Normal', icon: '⭕️' },
  { id: 'butterfly', name: 'Pink Butterfly', icon: '🦋', filterOverlay: 'rgba(255, 182, 193, 0.28)', topBadgeText: '🦋 ✨ 🦋 ✨ 🦋' },
  { id: 'flower_crown', name: 'Golden Tiara', icon: '👑', filterOverlay: 'rgba(255, 215, 0, 0.22)', topBadgeText: '🌸 👑 🌸 👑 🌸' },
  { id: 'soft_glam', name: 'Soft Glam', icon: '💖', filterOverlay: 'rgba(255, 105, 180, 0.22)', topBadgeText: '✨ Soft Beauty ✨' },
  { id: 'goggles', name: 'Retro Sunglasses', icon: '🕶️', filterOverlay: 'rgba(255, 140, 0, 0.18)', topBadgeText: '🕶️ Cool Vibe 🕶️' },
  { id: 'dog', name: 'Puppy Ears', icon: '🐶', filterOverlay: 'rgba(255, 235, 59, 0.15)', topBadgeText: '🐶 Cute Puppy 🐶' },
  { id: 'neon', name: 'Cyber Neon', icon: '⚡️', filterOverlay: 'rgba(0, 242, 254, 0.2)', topBadgeText: '⚡️ Cyber Glow ⚡️' },
  { id: 'vintage', name: '90s Film', icon: '🎞️', filterOverlay: 'rgba(255, 154, 158, 0.25)', topBadgeText: '🎞️ Retro Grain 🎞️' },
];

interface LensCarouselProps {
  onSelectLens?: (lens: ARLens) => void;
}

export const LensCarousel: React.FC<LensCarouselProps> = ({ onSelectLens }) => {
  const [selectedId, setSelectedId] = useState('none');

  const handleSelect = (lens: ARLens) => {
    setSelectedId(lens.id);
    if (onSelectLens) onSelectLens(lens);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {LENSES.map((lens) => {
          const isSelected = lens.id === selectedId;
          return (
            <TouchableOpacity
              key={lens.id}
              style={{ alignItems: 'center', width: 64 }}
              onPress={() => handleSelect(lens)}
              activeOpacity={0.8}
            >
              <View style={[styles.lensItem, isSelected && styles.lensItemSelected]}>
                <Text style={styles.lensIcon}>{lens.icon}</Text>
              </View>
              <Text style={[styles.lensName, isSelected && styles.lensNameSelected]} numberOfLines={1}>
                {lens.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 70,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 16,
  },
  lensItem: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lensItemSelected: {
    borderColor: '#FFFC00',
    backgroundColor: 'rgba(255, 252, 0, 0.25)',
    transform: [{ scale: 1.15 }],
  },
  lensIcon: {
    fontSize: 24,
  },
  lensName: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  lensNameSelected: {
    color: '#FFFC00',
    fontWeight: '900',
  },
});

export default LensCarousel;
