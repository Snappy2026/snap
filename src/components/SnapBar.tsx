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
        {/* Left: Profile Bitmoji Avatar */}
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

        {/* Center: Responsive Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search"
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            style={styles.searchInput}
            onChangeText={onSearchChange}
          />
        </View>

        {/* Right Actions Group */}
        <View style={styles.rightActionsGroup}>
          <TouchableOpacity
            style={styles.adminBarBtn}
            onPress={() => setShowAdminModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.adminBarText}>🛡️ Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.stripeBarBtn}
            onPress={() => setShowSettingsModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.stripeBarText}>💳 Payouts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleAddFriendClick}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>👤➕</Text>
          </TouchableOpacity>
        </View>
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
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
    justifyContent: 'space-between',
  },
  profileButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  yellowRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#FFFC00',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  searchBox: {
    flex: 1,
    height: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginHorizontal: 2,
  },
  rightActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adminBarBtn: {
    backgroundColor: 'rgba(255, 252, 0, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFC00',
  },
  adminBarText: {
    color: '#FFFC00',
    fontSize: 10,
    fontWeight: '800',
  },
  stripeBarBtn: {
    backgroundColor: 'rgba(99, 91, 255, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#635BFF',
  },
  stripeBarText: {
    color: '#635BFF',
    fontSize: 10,
    fontWeight: '800',
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
