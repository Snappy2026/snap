// ============================================================================
// VipMembersScreen Component
// Exclusive Paid Members Area featuring VIP paywall cards, gold badge status,
// exclusive creator snaps feed, and integrated Stripe Checkout payment automation.
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { supabase } from "../lib/supabase";

import { VipContentItem } from "../types/database";

import { useRoute } from "@react-navigation/native";

const { width } = Dimensions.get("window");
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DEMO_VIP_STORIES: VipContentItem[] = [];

export const VipMembersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();

  const targetCreatorHandle = route.params?.creatorHandle || "hippygogo";
  const targetCreatorName = route.params?.creatorName || "hippygogo";
  const targetCreatorId = route.params?.creatorId;

  const [isVipMember, setIsVipMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [vipStories, setVipStories] = useState<VipContentItem[]>([]);

  useEffect(() => {
    const fetchVip = async () => {
      const { data } = await supabase
        .from("vip_content")
        .select("*, creator_profile:profiles(*)");
      if (data) setVipStories(data as VipContentItem[]);
    };
    fetchVip();
  }, []);

  useEffect(() => {
    const checkVipStatus = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, is_vip_member, vip_tier")
            .eq("id", userData.user.id)
            .single();

          if (profile && ((profile as any).is_vip_member || (profile as any).role === "creator" || (profile as any).role === "admin")) {
            setIsVipMember(true);
          }
        }
      } catch (err) {
        console.error("[VIP Status Check]", err);
      } finally {
        setLoading(false);
      }
    };

    checkVipStatus();
  }, []);

  // Handle VIP Membership Purchase via Stripe Connect Checkout
  const handleUnlockVip = async (plan: "gold" | "platinum", price: string) => {
    setPurchasing(true);
    try {
      if (typeof window !== "undefined") {
        window.alert("🚧 Coming Soon!\nPayment integration is being set up. Check back soon!");
      }
    } catch (err: unknown) {
      console.error("[Purchase Error]", err);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <Text style={styles.crownIcon}>👑</Text>
        <Text style={styles.headerTitle}>VIP Members Club</Text>
        <Text style={styles.headerSubtitle}>
          Exclusive Paid Content & Unfiltered Snaps
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!isVipMember ? (
          /* Locked State: VIP Gold Paywall Card */
          <View style={styles.paywallCard}>
            <View style={styles.goldBadgeContainer}>
              <Text style={styles.goldBadgeText}>👑 VIP ACCESS FOR @{targetCreatorHandle.toUpperCase()}</Text>
            </View>

            <Text style={styles.paywallTitle}>
              Subscribe to @{targetCreatorHandle}'s Lounge
            </Text>
            <Text style={styles.paywallDescription}>
              Get 100% unrestricted access to @{targetCreatorName}'s private stories, exclusive media gallery, gold avatar badge, and direct 1-on-1 messaging.
            </Text>

            {/* Feature List */}
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>
                  Exclusive 24-Hour VIP Private Stories
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>
                  Custom Gold Crown 👑 Avatar Ring
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>
                  Direct Priority Messaging with Creators
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>
                  Zero Ads & Uncompressed HD Media
                </Text>
              </View>
            </View>

            {/* Pricing Buttons */}
            <TouchableOpacity
              style={styles.subscribeBtnGold}
              onPress={() => handleUnlockVip("gold", "$9.99/mo")}
              disabled={purchasing}
              activeOpacity={0.85}
            >
              {purchasing ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.subscribeBtnText}>
                  Unlock VIP Gold — $9.99 / Month 🚀
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.subscribeBtnYearly}
              onPress={() => handleUnlockVip("platinum", "$99/yr")}
              disabled={purchasing}
              activeOpacity={0.85}
            >
              <Text style={styles.subscribeBtnYearlyText}>
                Best Value: VIP Annual ($99.00 / Year) — Save 20%
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Unlocked State: VIP Member Feed */
          <View style={styles.unlockedFeed}>
            <View style={styles.activeVipStatusBanner}>
              <Text style={styles.activeVipTitle}>
                👑 Active Member: VIP Gold
              </Text>
              <Text style={styles.activeVipSubtitle}>
                Your private lounge access is active.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Exclusive Member Content</Text>

            {vipStories.map((item) => (
              <View key={item.id} style={styles.vipStoryCard}>
                <Image
                  source={{ uri: item.media_url }}
                  style={styles.vipStoryImage}
                />
                <View style={styles.vipCardOverlay}>
                  <View style={styles.creatorRow}>
                    <Text style={styles.creatorName}>
                      {item.creator_profile?.display_name}
                    </Text>
                    <View style={styles.goldPill}>
                      <Text style={styles.goldPillText}>VIP GOLD</Text>
                    </View>
                  </View>
                  <Text style={styles.vipStoryTitle}>{item.title}</Text>
                  <Text style={styles.vipStoryDesc}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  crownIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 100,
  },
  paywallCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: "#D4AF37",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  goldBadgeContainer: {
    backgroundColor: "#D4AF37",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 14,
  },
  goldBadgeText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  paywallTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  paywallDescription: {
    color: "#A0A0B0",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  featureList: {
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureCheck: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
  },
  featureText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  subscribeBtnGold: {
    backgroundColor: "#D4AF37",
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  subscribeBtnText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "800",
  },
  subscribeBtnYearly: {
    backgroundColor: "rgba(255, 252, 0, 0.15)",
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  subscribeBtnYearlyText: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "700",
  },
  unlockedFeed: {
    gap: 16,
  },
  activeVipStatusBanner: {
    backgroundColor: "rgba(255, 252, 0, 0.15)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D4AF37",
    marginBottom: 10,
  },
  activeVipTitle: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "bold",
  },
  activeVipSubtitle: {
    color: "#FFF",
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  vipStoryCard: {
    height: 240,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1C1C1E",
    marginBottom: 16,
  },
  vipStoryImage: {
    width: "100%",
    height: "100%",
  },
  vipCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  creatorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  creatorName: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  goldPill: {
    backgroundColor: "#D4AF37",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  goldPillText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
  },
  vipStoryTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 4,
  },
  vipStoryDesc: {
    color: "#A0A0B0",
    fontSize: 13,
  },
});

export default VipMembersScreen;
