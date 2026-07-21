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
}

const LENSES: ARLens[] = [
  { id: 'none', name: 'Normal', icon: '⭕️' },
  { id: 'dog', name: 'Dog Ears', icon: '🐶', filterOverlay: 'rgba(255, 235, 59, 0.15)' },
  { id: 'neon', name: 'Cyber Neon', icon: '⚡️', filterOverlay: 'rgba(0, 242, 254, 0.2)' },
  { id: 'vintage', name: '90s Film', icon: '🎞️', filterOverlay: 'rgba(255, 154, 158, 0.25)' },
  { id: 'beauty', name: 'Soft Glow', icon: '✨', filterOverlay: 'rgba(255, 255, 255, 0.15)' },
  { id: 'bw', name: 'Noir B&W', icon: '🕶️', filterOverlay: 'rgba(0, 0, 0, 0.4)' },
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
              style={[styles.lensItem, isSelected && styles.lensItemSelected]}
              onPress={() => handleSelect(lens)}
              activeOpacity={0.8}
            >
              <Text style={styles.lensIcon}>{lens.icon}</Text>
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
});

export default LensCarousel;
