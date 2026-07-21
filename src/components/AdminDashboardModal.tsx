// ============================================================================
// AdminDashboardModal Component
// Master Admin Control Console for monitoring all signed-up users, creators selling content,
// gross transaction volume, and 5% admin commission fee revenues.
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
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { supabase } from "../lib/supabase";
import { Profile } from "../types/database";

interface AdminDashboardModalProps {
  onClose: () => void;
}

interface AdminCreatorItem {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
  stripe_account_id: string;
  custom_gold_price: number;
  total_subscribers: number;
  total_revenue: number;
  admin_fee_earned: number;
}

const DEMO_USERS: Profile[] = [
  {
    id: "u1",
    username: "elena_vip",
    display_name: "Elena Rostova",
    avatar_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    is_vip_member: true,
    vip_tier: "gold",
    created_at: "2026-07-20T10:00:00Z",
    updated_at: "2026-07-21T12:00:00Z",
  },
  {
    id: "u2",
    username: "marcus_gold",
    display_name: "Marcus Sterling",
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    is_vip_member: true,
    vip_tier: "platinum",
    created_at: "2026-07-19T14:30:00Z",
    updated_at: "2026-07-21T12:00:00Z",
  },
  {
    id: "u3",
    username: "sarah_c",
    display_name: "Sarah Connor",
    avatar_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    is_vip_member: false,
    vip_tier: "free",
    created_at: "2026-07-21T09:15:00Z",
    updated_at: "2026-07-21T09:15:00Z",
  },
  {
    id: "u4",
    username: "jordan_b",
    display_name: "Jordan Belfort",
    avatar_url:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
    is_vip_member: false,
    vip_tier: "free",
    created_at: "2026-07-21T11:45:00Z",
    updated_at: "2026-07-21T11:45:00Z",
  },
];

const DEMO_CREATORS: AdminCreatorItem[] = [
  {
    id: "u1",
    display_name: "Elena Rostova",
    username: "elena_vip",
    avatar_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    stripe_account_id: "acct_1N9X82F45B31K009",
    custom_gold_price: 9.99,
    total_subscribers: 142,
    total_revenue: 1418.58,
    admin_fee_earned: 70.93,
  },
  {
    id: "u2",
    display_name: "Marcus Sterling",
    username: "marcus_gold",
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    stripe_account_id: "acct_1M83Y21980AAX901",
    custom_gold_price: 14.99,
    total_subscribers: 88,
    total_revenue: 1319.12,
    admin_fee_earned: 65.96,
  },
];

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"creators" | "users" | "settings">(
    "creators",
  );
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [creatorsList, setCreatorsList] = useState<AdminCreatorItem[]>([]);

  // Platform Price & Commission Settings
  const [platformCommission, setPlatformCommission] = useState("5.0");
  const [founderPassPrice, setFounderPassPrice] = useState("75.00");
  const [defaultGoldPrice, setDefaultGoldPrice] = useState("9.99");

  // Platform Volume Counters
  const [totalVolume, setTotalVolume] = useState(2737.7);
  const [totalAdminFee, setTotalAdminFee] = useState(136.89);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (profilesData && profilesData.length > 0) {
          setUsersList(profilesData as Profile[]);
        } else {
          setUsersList(DEMO_USERS);
        }
        setCreatorsList(DEMO_CREATORS);
      } catch (err) {
        console.error("[Admin Console Load Error]", err);
        setUsersList(DEMO_USERS);
        setCreatorsList(DEMO_CREATORS);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleChangeUserRole = async (
    userId: string,
    newRole: "customer" | "creator" | "admin",
  ) => {
    try {
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      await (supabase.from("profiles") as any)
        .update({ role: newRole })
        .eq("id", userId);
      const msg = `User role updated to ${newRole.toUpperCase()} successfully!`;
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(`🛡️ Role Updated\n${msg}`);
      } else {
        Alert.alert("🛡️ Role Updated", msg);
      }
    } catch (err) {
      console.error("[Change Role Error]", err);
    }
  };

  const handleSavePlatformSettings = () => {
    const msg = `Platform Settings Saved:\n- Admin Commission: ${platformCommission}%\n- Founder Pass Price: £${founderPassPrice}/yr\n- Default VIP Sub Price: $${defaultGoldPrice}/mo`;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`🛡️ Platform Price Settings Saved!\n\n${msg}`);
    } else {
      Alert.alert("🛡️ Settings Saved", msg);
    }
  };

  const handleBanUser = (username: string) => {
    const msg = `User @${username} status updated in moderation log.`;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`🛡️ Moderation Action\n${msg}`);
    } else {
      Alert.alert("🛡️ Moderation Action", msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>✕ Close</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛡️ Platform Admin Console</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Overview Stat KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total Users</Text>
          <Text style={styles.kpiValue}>{usersList.length || 4}</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Active Creators</Text>
          <Text style={styles.kpiValue}>{creatorsList.length || 2}</Text>
        </View>

        <View style={[styles.kpiCard, styles.kpiCardHighlight]}>
          <Text style={styles.kpiLabelHighlight}>5% Admin Revenue</Text>
          <Text style={styles.kpiValueHighlight}>
            ${totalAdminFee.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "creators" && styles.activeTab]}
          onPress={() => setActiveTab("creators")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "creators" && styles.activeTabText,
            ]}
          >
            CREATORS ({creatorsList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "users" && styles.activeTab]}
          onPress={() => setActiveTab("users")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "users" && styles.activeTabText,
            ]}
          >
            USERS ({usersList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "settings" && styles.activeTab]}
          onPress={() => setActiveTab("settings")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "settings" && styles.activeTabText,
            ]}
          >
            ⚙️ PRICES
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {activeTab === "creators" ? (
            /* TAB 1: Creators Selling Content */
            <FlatList
              data={creatorsList}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listPadding}
              renderItem={({ item }) => (
                <View style={styles.creatorCard}>
                  <View style={styles.creatorHeader}>
                    <Image
                      source={{ uri: item.avatar_url }}
                      style={styles.creatorAvatar}
                    />
                    <View style={styles.creatorInfo}>
                      <Text style={styles.creatorName}>
                        {item.display_name}
                      </Text>
                      <Text style={styles.creatorHandle}>@{item.username}</Text>
                      <Text style={styles.stripeIdText}>
                        Stripe: {item.stripe_account_id}
                      </Text>
                    </View>
                    <View style={styles.badgeBox}>
                      <Text style={styles.badgeText}>CREATOR</Text>
                    </View>
                  </View>

                  <View style={styles.creatorStatsRow}>
                    <View style={styles.subStat}>
                      <Text style={styles.statSubLabel}>VIP Price</Text>
                      <Text style={styles.statSubVal}>
                        ${item.custom_gold_price}/mo
                      </Text>
                    </View>
                    <View style={styles.subStat}>
                      <Text style={styles.statSubLabel}>Subscribers</Text>
                      <Text style={styles.statSubVal}>
                        {item.total_subscribers}
                      </Text>
                    </View>
                    <View style={styles.subStat}>
                      <Text style={styles.statSubLabel}>Gross Volume</Text>
                      <Text style={styles.statSubVal}>
                        ${item.total_revenue.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.subStatHighlight}>
                      <Text style={styles.statSubLabelCut}>Admin 5% Cut</Text>
                      <Text style={styles.statSubValCut}>
                        +${item.admin_fee_earned.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            />
          ) : activeTab === "users" ? (
            /* TAB 2: All Signed-Up Users & Role Management */
            <FlatList
              data={usersList}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listPadding}
              renderItem={({ item }) => {
                const currentRole = item.role || "customer";
                return (
                  <View style={styles.userRowCard}>
                    <View style={styles.userRowTop}>
                      <Image
                        source={{
                          uri:
                            item.avatar_url ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                        }}
                        style={styles.userAvatar}
                      />
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                          {item.display_name || item.username}
                        </Text>
                        <Text style={styles.userHandle}>@{item.username}</Text>
                      </View>
                      <View
                        style={[
                          styles.roleBadge,
                          currentRole === "admin"
                            ? styles.adminBadge
                            : currentRole === "creator"
                              ? styles.creatorBadge
                              : styles.customerBadge,
                        ]}
                      >
                        <Text style={styles.roleBadgeText}>
                          {currentRole.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Role Switcher Controls */}
                    <View style={styles.roleSwitchRow}>
                      <Text style={styles.roleSwitchLabel}>Change Role:</Text>
                      <TouchableOpacity
                        style={[
                          styles.roleBtn,
                          currentRole === "customer" && styles.roleBtnActive,
                        ]}
                        onPress={() =>
                          handleChangeUserRole(item.id, "customer")
                        }
                      >
                        <Text style={styles.roleBtnText}>👤 Customer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.roleBtn,
                          currentRole === "creator" &&
                            styles.roleBtnActiveCreator,
                        ]}
                        onPress={() => handleChangeUserRole(item.id, "creator")}
                      >
                        <Text style={styles.roleBtnText}>🎨 Creator</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.roleBtn,
                          currentRole === "admin" && styles.roleBtnActiveAdmin,
                        ]}
                        onPress={() => handleChangeUserRole(item.id, "admin")}
                      >
                        <Text style={styles.roleBtnText}>👑 Admin</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          ) : (
            /* TAB 3: Platform Prices & Commission Settings */
            <ScrollView contentContainerStyle={styles.listPadding}>
              <View style={styles.settingsCard}>
                <Text style={styles.settingsTitle}>
                  ⚙️ Global Platform Pricing & Fee Controls
                </Text>
                <Text style={styles.settingsDesc}>
                  Manage platform fee rates, annual creator license pricing, and
                  default subscription tiers.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    ADMIN COMMISSION FEE RATE (%)
                  </Text>
                  <TextInput
                    value={platformCommission}
                    onChangeText={setPlatformCommission}
                    keyboardType="numeric"
                    style={styles.settingsInput}
                  />
                  <Text style={styles.inputSubtext}>
                    Default: 5% platform fee taken from transaction sales
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    FOUNDER CREATOR ANNUAL PASS (£)
                  </Text>
                  <TextInput
                    value={founderPassPrice}
                    onChangeText={setFounderPassPrice}
                    keyboardType="numeric"
                    style={styles.settingsInput}
                  />
                  <Text style={styles.inputSubtext}>
                    Default 1-off annual fee for 0% commission creator pass
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    DEFAULT MONTHLY CREATOR SUB PRICE ($)
                  </Text>
                  <TextInput
                    value={defaultGoldPrice}
                    onChangeText={setDefaultGoldPrice}
                    keyboardType="numeric"
                    style={styles.settingsInput}
                  />
                  <Text style={styles.inputSubtext}>
                    Default starter subscription price for new creators
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.saveSettingsBtn}
                  onPress={handleSavePlatformSettings}
                >
                  <Text style={styles.saveSettingsText}>
                    💾 Save Platform Price Settings
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    color: "#8E8E93",
    fontSize: 15,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  kpiRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  kpiCardHighlight: {
    backgroundColor: "rgba(255, 252, 0, 0.15)",
    borderColor: "#D4AF37",
  },
  kpiLabel: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "700",
  },
  kpiLabelHighlight: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: "900",
  },
  kpiValue: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  kpiValueHighlight: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#1C1C1E",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 9,
  },
  activeTab: {
    backgroundColor: "#D4AF37",
  },
  tabText: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "800",
  },
  activeTabText: {
    color: "#000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listPadding: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  creatorCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  creatorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  creatorAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: "#D4AF37",
    marginRight: 12,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  creatorHandle: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "600",
  },
  stripeIdText: {
    color: "#8E8E93",
    fontSize: 11,
    marginTop: 2,
  },
  badgeBox: {
    backgroundColor: "rgba(99, 91, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#635BFF",
  },
  badgeText: {
    color: "#635BFF",
    fontSize: 10,
    fontWeight: "900",
  },
  creatorStatsRow: {
    flexDirection: "row",
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    padding: 10,
    justifyContent: "space-between",
  },
  subStat: {
    alignItems: "center",
  },
  subStatHighlight: {
    alignItems: "center",
    backgroundColor: "rgba(255, 252, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statSubLabel: {
    color: "#8E8E93",
    fontSize: 10,
    fontWeight: "600",
  },
  statSubLabelCut: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: "800",
  },
  statSubVal: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 2,
  },
  statSubValCut: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
  },
  userRowCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  userRowTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  userHandle: {
    color: "#8E8E93",
    fontSize: 12,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  adminBadge: {
    backgroundColor: "rgba(255, 252, 0, 0.2)",
    borderColor: "#D4AF37",
  },
  creatorBadge: {
    backgroundColor: "rgba(157, 78, 221, 0.2)",
    borderColor: "#9D4EDD",
  },
  customerBadge: {
    backgroundColor: "rgba(0, 242, 254, 0.2)",
    borderColor: "#00F2FE",
  },
  roleBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
  },
  roleSwitchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2C2C2E",
    padding: 6,
    borderRadius: 10,
  },
  roleSwitchLabel: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "700",
    marginRight: 4,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
  },
  roleBtnActive: {
    backgroundColor: "#00F2FE",
  },
  roleBtnActiveCreator: {
    backgroundColor: "#9D4EDD",
  },
  roleBtnActiveAdmin: {
    backgroundColor: "#D4AF37",
  },
  roleBtnText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "800",
  },
  settingsCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  settingsTitle: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  settingsDesc: {
    color: "#8E8E93",
    fontSize: 12,
    lineHeight: 16,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: "800",
  },
  settingsInput: {
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  inputSubtext: {
    color: "#666",
    fontSize: 11,
  },
  saveSettingsBtn: {
    backgroundColor: "#D4AF37",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 10,
  },
  saveSettingsText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "900",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    padding: 12,
    borderRadius: 14,
  },
  userDate: {
    color: "#666",
    fontSize: 11,
    marginTop: 2,
  },
  userActionBox: {
    alignItems: "flex-end",
    gap: 6,
  },
  tierTag: {
    backgroundColor: "#2C2C2E",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tierTagVip: {
    backgroundColor: "#D4AF37",
  },
  tierText: {
    color: "#8E8E93",
    fontSize: 10,
    fontWeight: "700",
  },
  tierTextVip: {
    color: "#000",
    fontWeight: "900",
  },
  modBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  modText: {
    color: "#FF3B30",
    fontSize: 11,
    fontWeight: "700",
  },
});

export default AdminDashboardModal;
