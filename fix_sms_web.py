import re

filepath = 'src/components/ContactInviteModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Fix handleSmsInvite
old_sms_web = """      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert("SMS invite is only supported on mobile devices.");
      } else {
        await Linking.openURL(smsUrl);
      }"""
      
new_sms_web = """      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.location.href = smsUrl;
      } else {
        await Linking.openURL(smsUrl);
      }"""
      
content = content.replace(old_sms_web, new_sms_web)

# 2. Fix handleBulkSMSInvite
old_bulk_sms = """    try {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(
          `🚀 Bulk SMS Invites Sent!\\nInvited ${selectedPhoneNumbers.length} contacts:\\n${selectedPhoneNumbers.join("\\n")}`,
        );
      } else {
        Alert.alert(
          "Invites Sent! 📱",
          `Sent SMS invites to ${selectedPhoneNumbers.length} contacts.`,
        );
      }
      onClose();
    } catch (err: unknown) {
      console.error("[Bulk Invite Error]", err);
    } finally {
      setSending(false);
    }"""
    
new_bulk_sms = """    const inviteMessage = encodeURIComponent(
      "Hey! Join me on Snapchat 👻 Download the app here: https://snap.app/download/join"
    );
    const cleanPhones = selectedPhoneNumbers.map(p => p.replace(/[^0-9]/g, ""));
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
    }"""
    
content = content.replace(old_bulk_sms, new_bulk_sms)

with open(filepath, 'w') as f:
    f.write(content)

print("SMS Web linking fixed successfully.")
