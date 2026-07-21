// ============================================================================
// SnapBar Component
// Universal Snapchat Header Bar featuring Profile Bitmoji avatar with yellow ring,
// translucent search bar, and Add Friend / Phone Contact Sync trigger.
// ============================================================================

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Modal,
} from 'react-native';
import ContactInviteModal from './ContactInviteModal';
import CreatorSettingsModal from './CreatorSettingsModal';
import AdminDashboardModal from './AdminDashboardModal';

interface SnapBarProps {
  title?: string;
  onProfilePress?: () => void;
  onAddFriendPress?: () => void;
  onSearchChange?: (query: string) => void;
}

export const SnapBar: React.FC<SnapBarProps> = ({
  title = 'Chat',
  onProfilePress,
  onAddFriendPress,
  onSearchChange,
}) => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const handleProfileClick = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      setShowSettingsModal(true);
    }
  };

  const handleAddFriendClick = () => {
    if (onAddFriendPress) {
      onAddFriendPress();
    } else {
      setShowContactModal(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Left: Profile Bitmoji Avatar with Snapchat Yellow Ring */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={handleProfileClick}
          activeOpacity={0.8}
        >
          <View style={styles.yellowRing}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' }}
              style={styles.avatar}
            />
          </View>
        </TouchableOpacity>

        {/* 1-Tap Master Admin Console Button */}
        <TouchableOpacity
          style={styles.adminBarBtn}
          onPress={() => setShowAdminModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.adminBarText}>🛡️ Admin</Text>
        </TouchableOpacity>

        {/* 1-Tap Creator Stripe Payouts Button */}
        <TouchableOpacity
          style={styles.stripeBarBtn}
          onPress={() => setShowSettingsModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.stripeBarText}>💳 Payouts</Text>
        </TouchableOpacity>

        {/* Center: Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search"
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            style={styles.searchInput}
            onChangeText={onSearchChange}
          />
        </View>

        {/* Right: Add Friend & Contact Bulk SMS Invite Trigger */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleAddFriendClick}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>👤➕</Text>
        </TouchableOpacity>
      </View>

      {/* Bulk Phone Invites Modal */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowContactModal(false)}
      >
        <ContactInviteModal onClose={() => setShowContactModal(false)} />
      </Modal>

      {/* Creator & Account Settings Control Panel Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <CreatorSettingsModal onClose={() => setShowSettingsModal(false)} />
      </Modal>

      {/* Master Admin Console Modal */}
      <Modal
        visible={showAdminModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdminModal(false)}
      >
        <AdminDashboardModal onClose={() => setShowAdminModal(false)} />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  profileButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  yellowRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2.5,
    borderColor: '#FFFC00',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  adminBarBtn: {
    backgroundColor: 'rgba(255, 252, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFFC00',
    marginRight: 8,
  },
  adminBarText: {
    color: '#FFFC00',
    fontSize: 11,
    fontWeight: '800',
  },
  stripeBarBtn: {
    backgroundColor: 'rgba(99, 91, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#635BFF',
    marginRight: 8,
  },
  stripeBarText: {
    color: '#635BFF',
    fontSize: 11,
    fontWeight: '800',
  },
  searchBox: {
    flex: 1,
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 16,
  },
});

export default SnapBar;
