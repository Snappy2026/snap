import re

filepath = 'src/components/ContactInviteModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Insert handleSmsInvite right after handleWhatsAppInvite
sms_func = """
  // 1-Tap Invite via SMS Deep Link
  const handleSmsInvite = async (contact?: PhoneContact) => {
    const inviteMessage = encodeURIComponent(
      'Hey! Join me on Snapchat 👻 Download the app here: https://snap.app/download/join'
    );

    let smsUrl = `sms:?body=${inviteMessage}`;
    if (contact) {
      const cleanPhone = contact.phoneNumber.replace(/[^0-9]/g, '');
      smsUrl = `sms:${cleanPhone}?body=${inviteMessage}`;
    }

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('SMS invite is only supported on mobile devices.');
      } else {
        await Linking.openURL(smsUrl);
      }
    } catch (err) {
      console.error('[SMS Error]', err);
    }
  };
"""

content = content.replace(
    "  // Execute Bulk SMS Invite",
    sms_func + "\n  // Execute Bulk SMS Invite"
)

# 2. Add SMS banner right after WhatsApp banner
sms_banner = """
      {/* SMS Quick Share Bar */}
      <TouchableOpacity
        style={[styles.whatsAppShareBanner, { backgroundColor: '#007AFF', marginTop: 10 }]}
        onPress={() => handleSmsInvite()}
        activeOpacity={0.85}
      >
        <View style={styles.whatsAppIconCircle}>
          <Text style={styles.whatsAppEmoji}>📱</Text>
        </View>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>Invite Friends via SMS</Text>
          <Text style={styles.bannerSubtitle}>Send instant text message invites</Text>
        </View>
        <Text style={styles.arrowIcon}>›</Text>
      </TouchableOpacity>
"""
content = content.replace(
    "      {/* Search Input */}",
    sms_banner + "\n      {/* Search Input */}"
)

# 3. Add SMS individual button
sms_individual_btn = """
                  <TouchableOpacity
                    style={[styles.whatsAppIndividualBtn, { backgroundColor: '#007AFF', marginLeft: 6 }]}
                    onPress={() => handleSmsInvite(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.whatsAppBtnText}>SMS</Text>
                  </TouchableOpacity>
"""
# Replace the old actionGroup with one containing both buttons side-by-side
old_action = """                  <TouchableOpacity
                    style={styles.whatsAppIndividualBtn}
                    onPress={() => handleWhatsAppInvite(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.whatsAppBtnText}>WhatsApp</Text>
                  </TouchableOpacity>"""
                  
new_action = """                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      style={styles.whatsAppIndividualBtn}
                      onPress={() => handleWhatsAppInvite(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.whatsAppBtnText}>WA</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.whatsAppIndividualBtn, { backgroundColor: '#007AFF', marginLeft: 6 }]}
                      onPress={() => handleSmsInvite(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.whatsAppBtnText}>SMS</Text>
                    </TouchableOpacity>
                  </View>"""
                  
content = content.replace(old_action, new_action)


with open(filepath, 'w') as f:
    f.write(content)

print("ContactInviteModal updated successfully.")
