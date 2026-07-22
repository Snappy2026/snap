// ============================================================================
// ContactInviteModal Component
// Phone contact book sync, Bulk SMS invites, and WhatsApp deep-link sharing.
// ============================================================================

import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { supabase } from "../lib/supabase";

export interface PhoneContact {
  id: string;
  name: string;
  phoneNumber: string;
  isRegistered?: boolean;
}

const DEMO_CONTACTS: PhoneContact[] = [];

interface ContactInviteModalProps {
  onClose: () => void;
}

export const ContactInviteModal: React.FC<ContactInviteModalProps> = ({
  onClose,
}) => {
  const [contacts, setContacts] = useState<PhoneContact[]>(DEMO_CONTACTS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [creatorUsername, setCreatorUsername] = useState("");

  React.useEffect(() => {
    const fetchUser = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", userData.user.id)
          .maybeSingle();
        if ((profile as any)?.username) {
          setCreatorUsername((profile as any).username);
        } else {
          setCreatorUsername(userData.user.email?.split("@")[0] || "");
        }
      }
    };
    fetchUser();
  }, []);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } else {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const selectAllUnregistered = () => {
    const unregisteredIds = contacts
      .filter((c) => !c.isRegistered)
      .map((c) => c.id);
    setSelectedIds(unregisteredIds);
  };

  // Get dynamic site origin URL + creator invite parameter
  const getSiteInviteUrl = () => {
    const baseUrl = Platform.OS === "web" && typeof window !== "undefined"
      ? window.location.origin
      : "https://clubdior.com";
    return creatorUsername ? `${baseUrl}/?creator=${encodeURIComponent(creatorUsername)}` : baseUrl;
  };

  // 1-Tap Invite via WhatsApp Deep Link
  const handleWhatsAppInvite = async (contact?: PhoneContact) => {
    const siteUrl = getSiteInviteUrl();
    const inviteMessage = encodeURIComponent(
      `Hey! Check out my profile & stories on ClubDior 👻 Tap here to join: ${siteUrl}`,
    );

    let whatsappUrl = `https://wa.me/?text=${inviteMessage}`;
    if (contact) {
      const cleanPhone = contact.phoneNumber.replace(/[^0-9]/g, "");
      whatsappUrl = `https://wa.me/${cleanPhone}?text=${inviteMessage}`;
    }

    try {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.open(whatsappUrl, "_blank");
      } else {
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
          await Linking.openURL(whatsappUrl);
        } else {
          await Linking.openURL(
            `https://api.whatsapp.com/send?text=${inviteMessage}`,
          );
        }
      }
    } catch (err) {
      console.error("[WhatsApp Error]", err);
    }
  };

  // 1-Tap Invite via SMS Deep Link
  const handleSmsInvite = async (contact?: PhoneContact) => {
    const siteUrl = getSiteInviteUrl();
    const inviteMessage = encodeURIComponent(
      `Hey! Check out my profile & stories on ClubDior 👻 Tap here to join: ${siteUrl}`,
    );

    let smsUrl = `sms:?body=${inviteMessage}`;
    if (contact) {
      const cleanPhone = contact.phoneNumber.replace(/[^0-9]/g, "");
      smsUrl = `sms:${cleanPhone}?body=${inviteMessage}`;
    }

    try {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.location.href = smsUrl;
      } else {
        await Linking.openURL(smsUrl);
      }
    } catch (err) {
      console.error("[SMS Error]", err);
    }
  };

  // Execute Bulk SMS Invite
  const handleBulkSMSInvite = async () => {
    if (selectedIds.length === 0) {
      Alert.alert(
        "Select Contacts",
        "Please select at least one contact to invite.",
      );
      return;
    }

    setSending(true);
    const selectedPhoneNumbers = contacts
      .filter((c) => selectedIds.includes(c.id))
      .map((c) => c.phoneNumber);

    const siteUrl = getSiteInviteUrl();
    const inviteMessage = encodeURIComponent(
      `Hey! Check out my profile & stories on ClubDior 👻 Tap here to join: ${siteUrl}`,
    );
    const cleanPhones = selectedPhoneNumbers.map((p) =>
      p.replace(/[^0-9]/g, ""),
    );
    const smsUrl = `sms:${cleanPhones.join(",")}?body=${inviteMessage}`;

    try {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.location.href = smsUrl;
      } else {
        await Linking.openURL(smsUrl);
      }
      onClose();
    } catch (err: unknown) {
      console.error("[Bulk Invite Error]", err);
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneNumber.includes(searchQuery),
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Friends from Phone</Text>
        <TouchableOpacity
          style={styles.selectAllBtn}
          onPress={selectAllUnregistered}
        >
          <Text style={styles.selectAllText}>Select All</Text>
        </TouchableOpacity>
      </View>

      {/* WhatsApp Quick Share Bar */}
      <TouchableOpacity
        style={styles.whatsAppShareBanner}
        onPress={() => handleWhatsAppInvite()}
        activeOpacity={0.85}
      >
        <View style={styles.whatsAppIconCircle}>
          <Text style={styles.whatsAppEmoji}>💬</Text>
        </View>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>Invite Friends via WhatsApp</Text>
          <Text style={styles.bannerSubtitle}>
            Share instant link to WhatsApp contacts or groups
          </Text>
        </View>
        <Text style={styles.arrowIcon}>›</Text>
      </TouchableOpacity>

      {/* SMS Quick Share Bar */}
      <TouchableOpacity
        style={[
          styles.whatsAppShareBanner,
          { backgroundColor: "#007AFF", marginTop: 10 },
        ]}
        onPress={() => handleSmsInvite()}
        activeOpacity={0.85}
      >
        <View style={styles.whatsAppIconCircle}>
          <Text style={styles.whatsAppEmoji}>📱</Text>
        </View>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>Invite Friends via SMS</Text>
          <Text style={styles.bannerSubtitle}>
            Send instant text message invites
          </Text>
        </View>
        <Text style={styles.arrowIcon}>›</Text>
      </TouchableOpacity>

      {/* Search Input */}
      <View style={styles.searchBarContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          placeholder="Search name or phone number..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <View style={styles.contactRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{item.name[0]}</Text>
              </View>

              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
              </View>

              {item.isRegistered ? (
                <View style={styles.alreadyOnSnapBadge}>
                  <Text style={styles.badgeText}>On Adult+</Text>
                </View>
              ) : (
                <View style={styles.actionGroup}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      style={styles.whatsAppIndividualBtn}
                      onPress={() => handleWhatsAppInvite(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.whatsAppBtnText}>WA</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.whatsAppIndividualBtn,
                        { backgroundColor: "#007AFF", marginLeft: 6 },
                      ]}
                      onPress={() => handleSmsInvite(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.whatsAppBtnText}>SMS</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxActive,
                    ]}
                    onPress={() => toggleSelect(item.id)}
                    activeOpacity={0.8}
                  >
                    {isSelected && <Text style={styles.checkMark}>✓</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Floating Action Button */}
      {selectedIds.length > 0 && (
        <View style={styles.fabRow}>
          <TouchableOpacity
            style={styles.bulkSendFab}
            onPress={handleBulkSMSInvite}
            disabled={sending}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.bulkSendFabText}>
                Send SMS ({selectedIds.length}) 💬
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bulkSendFab, styles.whatsAppFab]}
            onPress={() => handleWhatsAppInvite()}
            activeOpacity={0.85}
          >
            <Text style={[styles.bulkSendFabText, styles.whatsAppFabText]}>
              WhatsApp Invite 🟢
            </Text>
          </TouchableOpacity>
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
    color: "#00F2FE",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  selectAllBtn: {
    padding: 6,
  },
  selectAllText: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "700",
  },
  whatsAppShareBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#128C7E", // WhatsApp Green accent
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  whatsAppIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  whatsAppEmoji: {
    fontSize: 20,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  bannerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
  },
  arrowIcon: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 120,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2C2C2E",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarInitial: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  phoneNumber: {
    color: "#8E8E93",
    fontSize: 13,
    marginTop: 2,
  },
  alreadyOnSnapBadge: {
    backgroundColor: "rgba(255, 252, 0, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  badgeText: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: "700",
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  whatsAppIndividualBtn: {
    backgroundColor: "#25D366",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  whatsAppBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: "#D4AF37",
    borderColor: "#D4AF37",
  },
  checkMark: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },
  fabRow: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    flexDirection: "row",
    gap: 12,
  },
  bulkSendFab: {
    backgroundColor: "#D4AF37",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  whatsAppFab: {
    backgroundColor: "#25D366",
  },
  bulkSendFabText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "800",
  },
  whatsAppFabText: {
    color: "#FFF",
  },
});

export default ContactInviteModal;
