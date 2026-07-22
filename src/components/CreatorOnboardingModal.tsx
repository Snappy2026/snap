// ============================================================================
// CreatorOnboardingModal Component
// Creator Subscription & Payment Selection Modal upon Creator Account Registration
// Features: 7-Day Free Promo Trial, $9.99/mo (5% fee), and Yearly Pro (0% fee).
// ============================================================================

import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { supabase } from "../lib/supabase";

interface CreatorOnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  userEmail?: string;
}

export const CreatorOnboardingModal: React.FC<CreatorOnboardingModalProps> = ({
  visible,
  onClose,
  userId,
  userEmail,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<"trial" | "monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);

  const handleConfirmPlan = async () => {
    setLoading(true);
    try {
      const expiresAt = new Date();
      if (selectedPlan === "trial") {
        expiresAt.setDate(expiresAt.getDate() + 7);
      } else if (selectedPlan === "monthly") {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      if (userId) {
        await (supabase.from("profiles") as any).upsert({
          id: userId,
          role: "creator",
          vip_tier: selectedPlan.toUpperCase(),
          vip_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      const planName =
        selectedPlan === "trial"
          ? "7-Day Free Creator Trial"
          : selectedPlan === "monthly"
          ? "Monthly Creator Plan ($9.99/mo)"
          : "Yearly Creator Pro ($99/yr - 0% Fee)";

      const msg = `Your ${planName} is now active! Welcome to Adult+ Creator Studio.`;
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(msg);
      } else {
        Alert.alert("Creator Plan Activated! 🎉", msg);
      }
      onClose();
    } catch (err: any) {
      console.error("[Creator Plan Error]", err);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🎨 Content Creator Onboarding</Text>
            <Text style={styles.headerSubtitle}>
              Choose your creator plan to start publishing Stories, Gallery & VIP Content
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Plan Option 1: 7-Day Free Promo Trial */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === "trial" && styles.selectedCard,
              ]}
              onPress={() => setSelectedPlan("trial")}
              activeOpacity={0.85}
            >
              <View style={styles.planBadgeContainer}>
                <Text style={styles.promoBadgeText}>🎁 PROMO TRIAL</Text>
              </View>
              <Text style={styles.planTitle}>7-Day Free Trial</Text>
              <Text style={styles.planPrice}>$0.00 <Text style={styles.periodText}>/ 7 Days</Text></Text>
              <Text style={styles.planDesc}>
                Full Creator tools free for 1 week. Test out uploading stories and VIP lounge.
              </Text>
              <Text style={styles.feeInfo}>Standard 5% platform fee after trial</Text>
            </TouchableOpacity>

            {/* Plan Option 2: Monthly Plan ($9.99/mo) */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === "monthly" && styles.selectedCard,
              ]}
              onPress={() => setSelectedPlan("monthly")}
              activeOpacity={0.85}
            >
              <Text style={styles.planTitle}>Monthly Creator Plan</Text>
              <Text style={styles.planPrice}>$9.99 <Text style={styles.periodText}>/ Month</Text></Text>
              <Text style={styles.planDesc}>
                Flexible month-to-month subscription. Cancel anytime.
              </Text>
              <Text style={styles.feeInfo}>5% platform fee on fan tips & subscriptions</Text>
            </TouchableOpacity>

            {/* Plan Option 3: Yearly Pro Plan (0% Fee) */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === "yearly" && styles.selectedCardYearly,
              ]}
              onPress={() => setSelectedPlan("yearly")}
              activeOpacity={0.85}
            >
              <View style={styles.planBadgeContainer}>
                <Text style={styles.goldBadgeText}>👑 BEST VALUE — 0% FEE</Text>
              </View>
              <Text style={styles.planTitleYearly}>Yearly Creator Pro</Text>
              <Text style={styles.planPriceGold}>$99.00 <Text style={styles.periodText}>/ Year</Text></Text>
              <Text style={styles.planDesc}>
                Maximum earnings! Save 20% on membership and pay zero platform fees.
              </Text>
              <Text style={styles.zeroFeeHighlight}>⭐ ⭐ 0% PLATFORM FEE (Keep 100% Revenue)</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirmPlan}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.confirmBtnText}>
                  {selectedPlan === "trial"
                    ? "Start 7-Day Free Trial ⚡️"
                    : `Activate ${selectedPlan === "yearly" ? "Yearly Pro (0% Fee)" : "Monthly Plan"} 🚀`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "92%",
    maxHeight: "90%",
    backgroundColor: "#121214",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.35)",
    overflow: "hidden",
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 6,
  },
  headerSubtitle: {
    color: "#A0A0B0",
    fontSize: 13,
    textAlign: "center",
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  planCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedCard: {
    borderColor: "#00F2FE",
    backgroundColor: "rgba(0, 242, 254, 0.08)",
  },
  selectedCardYearly: {
    borderColor: "#D4AF37",
    backgroundColor: "rgba(212, 175, 55, 0.12)",
  },
  planBadgeContainer: {
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  promoBadgeText: {
    color: "#00F2FE",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  goldBadgeText: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  planTitle: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "800",
  },
  planTitleYearly: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "900",
  },
  planPrice: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "900",
    marginVertical: 4,
  },
  planPriceGold: {
    color: "#D4AF37",
    fontSize: 24,
    fontWeight: "900",
    marginVertical: 4,
  },
  periodText: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "600",
  },
  planDesc: {
    color: "#CCC",
    fontSize: 13,
    marginBottom: 6,
  },
  feeInfo: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "600",
  },
  zeroFeeHighlight: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  confirmBtn: {
    backgroundColor: "#D4AF37",
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "900",
  },
});

export default CreatorOnboardingModal;
