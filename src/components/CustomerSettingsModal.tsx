// ============================================================================
// CustomerSettingsModal Component
// Dedicated Customer / Follower Account Dashboard showing total spent,
// active VIP subscriptions, unlocked PPV snaps, and profile photo settings.
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { supabase } from "../lib/supabase";

interface CustomerSettingsModalProps {
  onClose: () => void;
  onSignOut?: () => void;
  onUpgradeToCreator?: () => void;
}

export const CustomerSettingsModal: React.FC<CustomerSettingsModalProps> = ({
  onClose,
  onSignOut,
  onUpgradeToCreator,
}) => {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("user_member");
  const [displayName, setDisplayName] = useState("Snap Member");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  );

  // Customer Spending & Subscription Analytics State
  const [totalSpent, setTotalSpent] = useState<number>(29.97);
  const [activeSubscriptions, setActiveSubscriptions] = useState([
    {
      id: "sub-1",
      creator_name: "Alex Vance",
      tier: "Gold VIP",
      price: "$9.99/mo",
      renew_date: "2026-08-20",
    },
    {
      id: "sub-2",
      creator_name: "Sarah Connor",
      tier: "Platinum VIP",
      price: "$19.99/mo",
      renew_date: "2026-08-15",
    },
  ]);
  const [unlockedSnaps, setUnlockedSnaps] = useState([
    {
      id: "snap-1",
      title: "Exclusive VIP Beach Snap",
      price: "$1.99",
      date: "2026-07-20",
    },
    {
      id: "snap-2",
      title: "Behind The Scenes Reel",
      price: "$2.99",
      date: "2026-07-18",
    },
  ]);

  const fileInputRef = React.useRef<any>(null);

  useEffect(() => {
    const fetchCustomerProfile = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;

        if (user) {
          setEmail(user.email || "");
          setUsername(
            user.user_metadata?.username ||
              user.email?.split("@")[0] ||
              "member",
          );
          setDisplayName(user.user_metadata?.display_name || "Snap Member");
          if (user.user_metadata?.avatar_url) {
            setAvatarUrl(user.user_metadata.avatar_url);
          }
        }
      } catch (err) {
        console.error("[Fetch Customer Profile Error]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerProfile();
  }, []);

  const handleDevicePhotoUpload = () => {
    if (Platform.OS === "web" && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: any) => {
    const file = event.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setAvatarUrl(e.target.result as string);
          if (typeof window !== "undefined")
            window.alert("📸 Profile picture updated!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customer Account</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={onClose}>
            <Text style={styles.saveBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#D4AF37" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hidden File Input for Web */}
            {Platform.OS === "web" && (
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            )}

            {/* Profile Header Card */}
            <View style={styles.profileCard}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>{displayName}</Text>
                <Text style={styles.profileHandle}>@{username}</Text>
                <Text style={styles.badgeText}>
                  👤 Customer / Subscriber Account
                </Text>
              </View>
              {onSignOut && (
                <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut}>
                  <Text style={styles.signOutText}>Sign Out 🚪</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Photo Avatar Action Buttons */}
            <View style={styles.photoActionRow}>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={handleDevicePhotoUpload}
              >
                <Text style={styles.uploadBtnText}>
                  📁 Change Profile Photo
                </Text>
              </TouchableOpacity>
            </View>

            {/* CUSTOMER SPENDING SUMMARY CARD */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>💰 Total Spending Summary</Text>
              <Text style={styles.totalAmount}>${totalSpent.toFixed(2)}</Text>
              <Text style={styles.summaryDesc}>
                Total spent on VIP Creator Subscriptions and Unlocked Premium
                Pay-Per-View Snaps.
              </Text>
            </View>

            {/* ACTIVE SUBSCRIPTIONS */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                👑 Active VIP Subscriptions ({activeSubscriptions.length})
              </Text>
              {activeSubscriptions.map((sub) => (
                <View key={sub.id} style={styles.itemRow}>
                  <View>
                    <Text style={styles.itemTitle}>{sub.creator_name}</Text>
                    <Text style={styles.itemSubtitle}>
                      Tier: {sub.tier} ({sub.price})
                    </Text>
                  </View>
                  <Text style={styles.renewText}>Renews {sub.renew_date}</Text>
                </View>
              ))}
            </View>

            {/* UNLOCKED PPV SNAPS */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                🔒 Unlocked Premium Snaps ({unlockedSnaps.length})
              </Text>
              {unlockedSnaps.map((snap) => (
                <View key={snap.id} style={styles.itemRow}>
                  <View>
                    <Text style={styles.itemTitle}>{snap.title}</Text>
                    <Text style={styles.itemSubtitle}>
                      Unlocked on {snap.date}
                    </Text>
                  </View>
                  <Text style={styles.pricePaid}>{snap.price}</Text>
                </View>
              ))}
            </View>

            {/* UPGRADE TO CREATOR ACCOUNT BANNER */}
            <View style={styles.upgradeCard}>
              <Text style={styles.upgradeTitle}>
                🎨 Want to Monetize Your Own Snaps?
              </Text>
              <Text style={styles.upgradeDesc}>
                Become a Content Creator today to sell VIP Memberships and
                Pay-Per-View Snaps with direct 95% Stripe payouts!
              </Text>
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => {
                  onClose();
                  if (onUpgradeToCreator) onUpgradeToCreator();
                }}
              >
                <Text style={styles.upgradeBtnText}>
                  🚀 Upgrade to Creator Account
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  closeBtnText: {
    color: "#8E8E93",
    fontSize: 15,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  saveBtn: {
    backgroundColor: "#D4AF37",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveBtnText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "800",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    padding: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: "#00F2FE",
    marginRight: 14,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  profileHandle: {
    color: "#00F2FE",
    fontSize: 13,
    fontWeight: "600",
  },
  badgeText: {
    color: "#8E8E93",
    fontSize: 11,
    marginTop: 4,
  },
  signOutBtn: {
    backgroundColor: "rgba(255, 59, 48, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  signOutText: {
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "800",
  },
  photoActionRow: {
    marginTop: -6,
  },
  uploadBtn: {
    backgroundColor: "#1C1C1E",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00F2FE",
  },
  uploadBtnText: {
    color: "#00F2FE",
    fontSize: 13,
    fontWeight: "800",
  },
  summaryCard: {
    backgroundColor: "#161622",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#00F2FE",
  },
  summaryTitle: {
    color: "#00F2FE",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },
  totalAmount: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 4,
  },
  summaryDesc: {
    color: "#8E8E93",
    fontSize: 12,
  },
  sectionCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    padding: 16,
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  itemTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  itemSubtitle: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 2,
  },
  renewText: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "700",
  },
  pricePaid: {
    color: "#00F2FE",
    fontSize: 14,
    fontWeight: "800",
  },
  upgradeCard: {
    backgroundColor: "#1A102A",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#9D4EDD",
  },
  upgradeTitle: {
    color: "#9D4EDD",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  upgradeDesc: {
    color: "#CCC",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  upgradeBtn: {
    backgroundColor: "#9D4EDD",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
  },
  upgradeBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
  },
});

export default CustomerSettingsModal;
