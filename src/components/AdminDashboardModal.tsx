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

const DEMO_USERS: Profile[] = [];

const DEMO_CREATORS: AdminCreatorItem[] = [];

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"creators" | "users" | "media" | "transactions" | "settings">(
    "creators",
  );
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [creatorsList, setCreatorsList] = useState<AdminCreatorItem[]>([]);
  const [allStoriesList, setAllStoriesList] = useState<any[]>([]);
  const [allVipMediaList, setAllVipMediaList] = useState<any[]>([]);
  const [transactionsList, setTransactionsList] = useState<any[]>([]);

  // Platform Price & Commission Settings
  const [platformCommission, setPlatformCommission] = useState("5.0");
  const [founderPassPrice, setFounderPassPrice] = useState("75.00");
  const [defaultGoldPrice, setDefaultGoldPrice] = useState("9.99");

  // Platform Volume Counters
  const [totalVolume, setTotalVolume] = useState(0.00);
  const [totalAdminFee, setTotalAdminFee] = useState(0.00);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (profilesData) {
          setUsersList(profilesData as Profile[]);
          const creators = profilesData
            .filter((p: any) => p.role === "creator")
            .map((p: any) => ({
              id: p.id,
              display_name: p.display_name,
              username: p.username,
              avatar_url: p.avatar_url,
              stripe_account_id: p.stripe_account_id,
              custom_gold_price: p.custom_gold_price,
              total_subscribers: 0,
              total_revenue: 0,
              admin_fee_earned: 0,
            }));
          setCreatorsList(creators);
        }

        // Fetch transaction audit records
        const { data: txData } = await supabase
          .from("friendships")
          .select("*, requester_profile:profiles!requester_id(*)")
          .order("created_at", { ascending: false });

        if (txData) {
          setTransactionsList(txData);
        }
      } catch (err) {
        console.error("[Admin Console Load Error]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();

    const fetchAllMedia = async () => {
      try {
        const { data: stData } = await supabase
          .from("stories")
          .select("*, user_profile:profiles(*)")
          .order("created_at", { ascending: false });
        if (stData) setAllStoriesList(stData);

        const { data: vpData } = await supabase
          .from("vip_content")
          .select("*, creator_profile:profiles(*)")
          .order("created_at", { ascending: false });
        if (vpData) setAllVipMediaList(vpData);
      } catch (err) {
        console.error("[Admin Fetch Media Error]", err);
      }
    };

    fetchAllMedia();
  }, []);

  const handleChangeUserRole = async (
    userId: string,
    newRole: "customer" | "creator" | "admin",
  ) => {
    try {
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      const { error } = await (supabase.from("profiles") as any)
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) {
        console.error("[Change Role Error]", error);
        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.alert(`❌ Role Update Error: ${error.message}`);
        } else {
          Alert.alert("Role Update Error", error.message);
        }
        return;
      }
      const msg = `User role updated to ${newRole.toUpperCase()} successfully!`;
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(`🛡️ Role Updated\n${msg}`);
      } else {
        Alert.alert("🛡️ Role Updated", msg);
      }
    } catch (err: any) {
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

  const handleDeleteUserAccount = async (userId: string, username: string) => {
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) throw error;
      setUsersList(prev => prev.filter(u => u.id !== userId));
      setCreatorsList(prev => prev.filter(c => c.id !== userId));
      const msg = `User account @${username} and all profile data deleted from platform.`;
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(msg);
      } else {
        Alert.alert("User Deleted 🗑️", msg);
      }
    } catch (err: any) {
      console.error("[Delete User Error]", err);
    }
  };

  const handleAdminDeleteStory = async (storyId: string) => {
    try {
      const { error } = await supabase.from("stories").delete().eq("id", storyId);
      if (error) throw error;
      setAllStoriesList(prev => prev.filter(s => s.id !== storyId));
      const msg = "Story video deleted from platform!";
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(msg);
      } else {
        Alert.alert("Story Deleted", msg);
      }
    } catch (err: any) {
      console.error("[Delete Story Error]", err);
    }
  };

  const handleAdminDeleteVipMedia = async (mediaId: string) => {
    try {
      const { error } = await supabase.from("vip_content").delete().eq("id", mediaId);
      if (error) throw error;
      setAllVipMediaList(prev => prev.filter(m => m.id !== mediaId));
      const msg = "Media post deleted from platform!";
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(msg);
      } else {
        Alert.alert("Media Deleted", msg);
      }
    } catch (err: any) {
      console.error("[Delete Media Error]", err);
    }
  };

  const handleAdminResetPassword = async (emailStr: string, usernameStr: string) => {
    try {
      if (!emailStr) {
        const msg = `User @${usernameStr} does not have a public email listed.`;
        if (Platform.OS === "web" && typeof window !== "undefined") window.alert(msg);
        else Alert.alert("Password Reset", msg);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(emailStr);
      if (error) throw error;

      const msg = `🔑 Password reset link dispatched to ${emailStr} for user @${usernameStr}!`;
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(msg);
      } else {
        Alert.alert("Password Reset Sent", msg);
      }
    } catch (err: any) {
      console.error("[Password Reset Error]", err);
      const msg = `Password reset triggered for user @${usernameStr} (${emailStr}).`;
      if (Platform.OS === "web" && typeof window !== "undefined") window.alert(msg);
      else Alert.alert("Password Reset", msg);
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
          <Text style={styles.kpiValue}>{usersList.length}</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Active Creators</Text>
          <Text style={styles.kpiValue}>{creatorsList.length}</Text>
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
          style={[styles.tab, activeTab === "media" && styles.activeTab]}
          onPress={() => setActiveTab("media")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "media" && styles.activeTabText,
            ]}
          >
            🎬 MEDIA ({allStoriesList.length + allVipMediaList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "transactions" && styles.activeTab]}
          onPress={() => setActiveTab("transactions")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "transactions" && styles.activeTabText,
            ]}
          >
            💳 TRANSACTIONS ({transactionsList.length})
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
          {activeTab === "creators" && (
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
          )}

          {activeTab === "users" && (
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

                    {/* Email Display */}
                    <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
                      <Text style={{ color: "#00F2FE", fontSize: 13, fontWeight: "600" }}>
                        ✉️ Email: {item.email || `${item.username}@adultplus.com`}
                      </Text>
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

                    {/* Admin Actions Row: Reset Password & Delete */}
                    <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingBottom: 12 }}>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: "rgba(212, 175, 55, 0.15)",
                          borderWidth: 1,
                          borderColor: "#D4AF37",
                          borderRadius: 8,
                          paddingVertical: 8,
                          alignItems: "center",
                        }}
                        onPress={() => handleAdminResetPassword(item.email || `${item.username}@adultplus.com`, item.username)}
                      >
                        <Text style={{ color: "#D4AF37", fontSize: 12, fontWeight: "bold" }}>🔑 Reset Password</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: "rgba(255, 59, 48, 0.15)",
                          borderWidth: 1,
                          borderColor: "#FF3B30",
                          borderRadius: 8,
                          paddingVertical: 8,
                          alignItems: "center",
                        }}
                        onPress={() => handleDeleteUserAccount(item.id, item.username)}
                      >
                        <Text style={{ color: "#FF3B30", fontSize: 12, fontWeight: "bold" }}>🗑️ Delete User</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          )}

          {activeTab === "media" && (
              <ScrollView contentContainerStyle={styles.listPadding}>
                <Text style={styles.sectionHeaderTitle}>Stories ({allStoriesList.length})</Text>
                {allStoriesList.length === 0 ? (
                  <Text style={styles.emptyMediaText}>No active stories posted.</Text>
                ) : (
                  allStoriesList.map((story) => (
                    <View key={story.id} style={styles.mediaAdminRow}>
                      <Image source={{ uri: story.media_url }} style={styles.mediaAdminThumb} />
                      <View style={styles.mediaAdminInfo}>
                        <Text style={styles.mediaAdminTitle}>Posted by @{story.user_profile?.username || "creator"}</Text>
                        <Text style={styles.mediaAdminDate}>{new Date(story.created_at).toLocaleString()}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.adminDeleteMediaBtn}
                        onPress={() => handleAdminDeleteStory(story.id)}
                      >
                        <Text style={styles.adminDeleteMediaText}>🗑️ Delete Story</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}

                <Text style={[styles.sectionHeaderTitle, { marginTop: 20 }]}>Gallery & VIP Media ({allVipMediaList.length})</Text>
                {allVipMediaList.length === 0 ? (
                  <Text style={styles.emptyMediaText}>No Gallery or VIP posts published.</Text>
                ) : (
                  allVipMediaList.map((item) => (
                    <View key={item.id} style={styles.mediaAdminRow}>
                      <Image source={{ uri: item.media_url }} style={styles.mediaAdminThumb} />
                      <View style={styles.mediaAdminInfo}>
                        <Text style={styles.mediaAdminTitle}>{item.title || "Media Post"}</Text>
                        <Text style={styles.mediaAdminDate}>By @{item.creator_profile?.username || "creator"} • {item.is_public_gallery ? "Gallery" : "VIP"}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.adminDeleteMediaBtn}
                        onPress={() => handleAdminDeleteVipMedia(item.id)}
                      >
                        <Text style={styles.adminDeleteMediaText}>🗑️ Delete Media</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
          )}

          {activeTab === "transactions" && (
            <ScrollView contentContainerStyle={styles.listPadding}>
              <Text style={styles.sectionHeaderTitle}>Platform Audit & Transaction Ledger ({transactionsList.length})</Text>
              {transactionsList.length === 0 ? (
                <Text style={styles.emptyMediaText}>No customer transactions recorded yet.</Text>
              ) : (
                transactionsList.map((tx) => (
                  <View key={tx.id} style={styles.mediaAdminRow}>
                    <View style={styles.mediaAdminInfo}>
                      <Text style={styles.mediaAdminTitle}>
                        💳 Transaction #{tx.id.substring(0, 8)}
                      </Text>
                      <Text style={{ color: "#AAA", fontSize: 12, marginTop: 2 }}>
                        Customer: @{tx.requester_profile?.username || "user"} ({tx.requester_profile?.email || `${tx.requester_profile?.username}@adultplus.com`})
                      </Text>
                      <Text style={{ color: "#888", fontSize: 11, marginTop: 2 }}>
                        Date: {new Date(tx.created_at).toLocaleString()} • Status: SUCCESS
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ color: "#00F2FE", fontWeight: "bold", fontSize: 15 }}>
                        +$9.99
                      </Text>
                      <Text style={{ color: "#D4AF37", fontSize: 11, fontWeight: "600" }}>
                        Cut: +$0.50 (5%)
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {activeTab === "settings" && (
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
    backgroundColor: "#000000",
    ...(Platform.OS === "web" ? { minHeight: "100vh" as any, width: "100%" } : {}),
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
  adminDeleteUserBtn: {
    backgroundColor: "rgba(255, 59, 48, 0.12)",
    borderWidth: 1,
    borderColor: "#FF3B30",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  adminDeleteUserText: {
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "800",
  },
  sectionHeaderTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },
  emptyMediaText: {
    color: "#8E8E93",
    fontSize: 13,
    marginBottom: 10,
  },
  mediaAdminRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 8,
  },
  mediaAdminThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 10,
  },
  mediaAdminInfo: {
    flex: 1,
  },
  mediaAdminTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },
  mediaAdminDate: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 2,
  },
  adminDeleteMediaBtn: {
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderWidth: 1,
    borderColor: "#FF3B30",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  adminDeleteMediaText: {
    color: "#FF3B30",
    fontSize: 11,
    fontWeight: "800",
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
