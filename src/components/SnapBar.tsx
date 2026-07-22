// ============================================================================
// SnapBar Component
// Universal Adult+ Header Bar featuring Profile Bitmoji avatar with yellow ring,
// translucent search bar, and Add Friend / Phone Contact Sync trigger.
// ============================================================================

import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Modal,
  Platform,
} from "react-native";
import ContactInviteModal from "./ContactInviteModal";
import CreatorSettingsModal from "./CreatorSettingsModal";
import AdminDashboardModal from "./AdminDashboardModal";
import CustomerSettingsModal from "./CustomerSettingsModal";
import CreatorContentStudioModal from "./CreatorContentStudioModal";
import CreatorOnboardingModal from "./CreatorOnboardingModal";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";

interface SnapBarProps {
  title?: string;
  onProfilePress?: () => void;
  onAddFriendPress?: () => void;
  onSearchChange?: (query: string) => void;
}

export const SnapBar: React.FC<SnapBarProps> = ({
  title = "Chat",
  onProfilePress,
  onAddFriendPress,
  onSearchChange,
}) => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);

  // Declare ALL state before useEffects to avoid ordering issues
  const navigation = useNavigation<any>();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [displayName, setDisplayName] = useState("User");
  const [userRole, setUserRole] = useState<"admin" | "creator" | "customer">(
    "customer",
  );

  // Single consolidated useEffect that fetches user data and role
  React.useEffect(() => {
    const fetchUserAndRole = async () => {
      try {
        // Try getUser first
        let user: any = null;
        const { data: userData } = await supabase.auth.getUser();
        user = userData?.user;

        // Fallback: check active session if getUser returned null
        if (!user) {
          const { data: sessionData } = await supabase.auth.getSession();
          user = sessionData?.session?.user;
        }

        if (!user) {
          console.log("[SnapBar] No authenticated user found");
          return;
        }

        const emailStr = (user.email || "").toLowerCase();
        setUserEmail(user.email || "");
        setDisplayName(
          user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
          "User"
        );

        // Check if this is the master admin account
        const isAdminEmail = emailStr === "admin@clubdior.com";

        if (isAdminEmail) {
          setUserRole("admin");
          console.log("[SnapBar] Admin detected by email:", emailStr);
          return;
        }

        // For non-admin users, check the profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        const profileRole = (profile as any)?.role || user.user_metadata?.role;
        if (profileRole === "admin") {
          setUserRole("admin");
        } else if (profileRole === "creator") {
          setUserRole("creator");
        } else {
          setUserRole("customer");
        }
        console.log("[SnapBar] Role resolved:", profileRole || "customer", "for", emailStr);
      } catch (err) {
        console.error("[SnapBar Role Fetch Error]", err);
      }
    };
    fetchUserAndRole();
  }, []);

  // Derived state: isAdmin is true if role is admin OR email matches admin patterns
  const isAdmin = userRole === "admin";
  const displayRole = isAdmin ? "ADMIN" : userRole.toUpperCase();

  const handleProfileClick = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      setShowProfileModal(true);
    }
  };

  const handleSignOut = async () => {
    try {
      setShowProfileModal(false);
      await supabase.auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      });
    } catch (err) {
      console.error("[Sign Out Error]", err);
      navigation.navigate("Auth");
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
              source={{
                uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
              }}
              style={styles.avatar}
            />
          </View>
        </TouchableOpacity>

        {/* Center: Clean Logo Header */}
        <View style={styles.centerBrandContainer}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.headerLogoImage}
            resizeMode="contain"
          />
        </View>

        {/* Right Actions Group */}
        <View style={styles.rightActionsGroup}>
          {userRole === "admin" && (
            <TouchableOpacity
              style={styles.adminBarBtn}
              onPress={() => setShowAdminModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.adminBarText}>🛡️ Admin</Text>
            </TouchableOpacity>
          )}

          {userRole === "creator" && (
            <>
              <TouchableOpacity
                style={styles.studioBarBtn}
                onPress={() => setShowStudioModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.studioBarText}>🎨 Studio</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stripeBarBtn}
                onPress={() => setShowSettingsModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.stripeBarText}>💳 Payouts</Text>
              </TouchableOpacity>
            </>
          )}

          {userRole === "customer" && (
            <TouchableOpacity
              style={styles.customerBarBtn}
              onPress={() => setShowCustomerModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.customerBarText}>💰 Spending</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleAddFriendClick}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>👥</Text>
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

      {/* Customer Account Dashboard Modal */}
      {showProfileModal && (
        <Modal visible={showProfileModal} animationType="fade" transparent>
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.profileMenuBox}>
              <View style={styles.profileMenuHeader}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" }}
                  style={styles.menuAvatar}
                />
                <Text style={styles.menuDisplayName}>{displayName}</Text>
                <Text style={styles.menuEmail}>{userEmail}</Text>
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>{displayRole}</Text>
                </View>
              </View>

              <View style={styles.menuActionsGroup}>
                {isAdmin ? (
                  <>
                    <TouchableOpacity
                      style={styles.adminConsoleMenuBtn}
                      onPress={() => {
                        setShowProfileModal(false);
                        setShowAdminModal(true);
                      }}
                    >
                      <Text style={styles.adminConsoleMenuText}>🛡️ Open Master Admin Console</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.menuActionBtn}
                    onPress={() => {
                      setShowProfileModal(false);
                      if (userRole === "customer") setShowCustomerModal(true);
                      else setShowSettingsModal(true);
                    }}
                  >
                    <Text style={styles.menuActionText}>⚙️ Account Settings & Payouts</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.logoutActionBtn}
                  onPress={handleSignOut}
                >
                  <Text style={styles.logoutActionText}>🚪 Log Out</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.menuCloseBtn}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={styles.menuCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      )}

      {showStudioModal && (
        <CreatorContentStudioModal
          visible={showStudioModal}
          onClose={() => setShowStudioModal(false)}
        />
      )}

      {showCustomerModal && (
        <CustomerSettingsModal
          onClose={() => setShowCustomerModal(false)}
          onUpgradeToCreator={() => {
            setUserRole("creator");
            setShowSettingsModal(true);
          }}
        />
      )}

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
      {showAdminModal && (
        <Modal
          visible={showAdminModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowAdminModal(false)}
        >
          <View style={styles.webFullModalOverlay}>
            <AdminDashboardModal onClose={() => setShowAdminModal(false)} />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "transparent",
    zIndex: 100,
  },
  container: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 6,
    justifyContent: "space-between",
  },
  centerBrandContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogoImage: {
    width: 140,
    height: 38,
  },
  brandTitleText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  studioBarBtn: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D4AF37",
    marginRight: 6,
  },
  studioBarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  adminConsoleMenuBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  adminConsoleMenuText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "900",
  },
  webFullModalOverlay: {
    flex: 1,
    backgroundColor: "#000000",
    ...(Platform.OS === "web" ? { position: "fixed" as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 } : {}),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileMenuBox: {
    width: "86%",
    backgroundColor: "#121214",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    padding: 20,
    alignItems: "center",
  },
  profileMenuHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  menuAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  menuDisplayName: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
  menuEmail: {
    color: "#8E8E93",
    fontSize: 13,
    marginTop: 2,
  },
  roleTag: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
  },
  roleTagText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  menuActionsGroup: {
    width: "100%",
    gap: 10,
    marginBottom: 12,
  },
  menuActionBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  menuActionText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  logoutActionBtn: {
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  logoutActionText: {
    color: "#FF3B30",
    fontSize: 15,
    fontWeight: "800",
  },
  menuCloseBtn: {
    paddingVertical: 8,
  },
  menuCloseText: {
    color: "#8E8E93",
    fontSize: 14,
    fontWeight: "600",
  },
  profileButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  yellowRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#D4AF37",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  searchBox: {
    flex: 1,
    height: 34,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    marginHorizontal: 2,
  },
  rightActionsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  adminBarBtn: {
    backgroundColor: "rgba(255, 252, 0, 0.25)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  adminBarText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  stripeBarBtn: {
    backgroundColor: "rgba(99, 91, 255, 0.25)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#635BFF",
  },
  stripeBarText: {
    color: "#635BFF",
    fontSize: 10,
    fontWeight: "800",
  },
  customerBarBtn: {
    backgroundColor: "rgba(0, 242, 254, 0.22)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#00F2FE",
  },
  customerBarText: {
    color: "#00F2FE",
    fontSize: 10,
    fontWeight: "800",
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 0,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionIcon: {
    fontSize: 16,
  },
});

export default SnapBar;
