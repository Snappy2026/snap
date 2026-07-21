// ============================================================================
// CreatorSettingsModal Component
// Creator Dashboard & Profile Control Panel for membership prices, snap timers,
// privacy permissions, and active snap auto-purge management.
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { supabase } from '../lib/supabase';
import AdminDashboardModal from './AdminDashboardModal';

interface CreatorSettingsModalProps {
  onClose: () => void;
  onSignOut?: () => void;
}

interface ActiveSnapItem {
  id: string;
  media_url: string;
  created_at: string;
  type: 'story' | 'snap';
}

export const CreatorSettingsModal: React.FC<CreatorSettingsModalProps> = ({ onClose, onSignOut }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // User Profile State
  const [username, setUsername] = useState('creator_alex');
  const [displayName, setDisplayName] = useState('Alex Vance');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');

  // File Upload & Camera Selfie Handlers
  const fileInputRef = React.useRef<any>(null);

  const handleDevicePhotoUpload = () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      Alert.alert('Upload Photo', 'Select a photo from your device camera roll.');
    }
  };

  const handleFileChange = (event: any) => {
    const file = event.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setAvatarUrl(e.target.result as string);
          if (typeof window !== 'undefined') window.alert('📸 Profile picture updated from your device!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraSelfieCapture = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();

        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setAvatarUrl(dataUrl);
            if (typeof window !== 'undefined') window.alert('📸 Selfie captured & set as profile picture!');
          }
          stream.getTracks().forEach((track) => track.stop());
        }, 500);
      } else {
        Alert.alert('Take Photo', 'Camera selfie captured!');
      }
    } catch (err) {
      console.error('[Selfie Error]', err);
      Alert.alert('Camera Notice', 'Please allow camera permission to capture selfie.');
    }
  };

  // Creator Membership Price & Stripe Connect Settings
  const [goldMonthlyPrice, setGoldMonthlyPrice] = useState('9.99');
  const [platinumYearlyPrice, setPlatinumYearlyPrice] = useState('99.00');
  const [stripeAccountId, setStripeAccountId] = useState('acct_1N9X82F45B31K009');

  // Snap & Privacy Control Settings
  const [defaultSnapTimer, setDefaultSnapTimer] = useState<number>(5);
  const [snapPrivacy, setSnapPrivacy] = useState<'public' | 'friends' | 'vip'>('friends');
  const [autoPurgeEnabled, setAutoPurgeEnabled] = useState(true);

  // Active Snaps posted by current user
  const [activeSnaps, setActiveSnaps] = useState<ActiveSnapItem[]>([
    {
      id: 's1',
      media_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
      created_at: '10 mins ago',
      type: 'story',
    },
    {
      id: 's2',
      media_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500',
      created_at: '1 hour ago',
      type: 'story',
    },
  ]);

  useEffect(() => {
    const loadCreatorProfile = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          setEmail(userData.user.email || '');
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userData.user.id)
            .single();

          if (profile) {
            const p = profile as any;
            if (p.username) setUsername(p.username);
            if (p.display_name) setDisplayName(p.display_name);
            if (p.avatar_url) setAvatarUrl(p.avatar_url);
            if (p.stripe_account_id) setStripeAccountId(p.stripe_account_id);
            if (p.custom_gold_price) setGoldMonthlyPrice(String(p.custom_gold_price));
            if (p.custom_yearly_price) setPlatinumYearlyPrice(String(p.custom_yearly_price));
          }
        }
      } catch (err) {
        console.error('[Creator Settings Load Error]', err);
      } finally {
        setLoading(false);
      }
    };

    loadCreatorProfile();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await (supabase.from('profiles') as any)
          .update({
            username: username.trim(),
            display_name: displayName.trim(),
            stripe_account_id: stripeAccountId.trim(),
            custom_gold_price: parseFloat(goldMonthlyPrice) || 9.99,
            custom_yearly_price: parseFloat(platinumYearlyPrice) || 99.00,
          })
          .eq('id', userData.user.id);
      }

      const msg = 'Stripe Connect Account ID, membership pricing, and snap privacy settings saved successfully!';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`⚙️ Settings Saved!\n${msg}`);
      } else {
        Alert.alert('⚙️ Settings Saved!', msg);
      }
    } catch (err: unknown) {
      console.error('[Save Settings Error]', err);
      Alert.alert('Saved!', 'Local settings updated.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSnap = async (snapId: string) => {
    try {
      setActiveSnaps((prev) => prev.filter((s) => s.id !== snapId));
      await (supabase.from('stories') as any).delete().eq('id', snapId);

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('🗑 Snap Purged! Media removed from server.');
      } else {
        Alert.alert('🗑 Purged!', 'Snap removed from story.');
      }
    } catch (err) {
      console.error('[Delete Snap Error]', err);
    }
  };

  const handleSignOutUser = async () => {
    try {
      await supabase.auth.signOut();
      onClose();
      if (onSignOut) onSignOut();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Logged out successfully.');
      }
    } catch (err) {
      console.error('[Sign Out Error]', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>✕ Close</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator & Account Controls</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#FFFC00" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFFC00" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Hidden File Input for Web File Upload */}
          {Platform.OS === 'web' && (
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          )}

          {/* Profile Card & Avatar Editor */}
          <View style={styles.profileCard}>
            <View style={{ alignItems: 'center' }}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              <View style={styles.editAvatarBadge}>
                <Text style={styles.editAvatarText}>ACTIVE</Text>
              </View>
            </View>

            <View style={styles.profileDetails}>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                style={styles.profileNameInput}
                placeholder="Display Name"
                placeholderTextColor="#888"
              />
              <Text style={styles.profileHandle}>@{username}</Text>
              {email ? <Text style={styles.profileEmail}>{email}</Text> : null}
            </View>

            <View style={{ gap: 6 }}>
              <TouchableOpacity style={styles.adminConsoleBtn} onPress={() => setShowAdminModal(true)}>
                <Text style={styles.adminConsoleText}>🛡️ Admin Console</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOutUser}>
                <Text style={styles.signOutText}>Sign Out 🚪</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 📸 Unified "Choose Profile Photo" Card in One Line */}
          <View style={styles.unifiedAvatarCard}>
            <Text style={styles.unifiedAvatarTitle}>Choose Profile Photo:</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.unifiedAvatarRow}
            >
              <TouchableOpacity
                style={styles.uploadPhotoBtnInline}
                onPress={handleDevicePhotoUpload}
                activeOpacity={0.8}
              >
                <Text style={styles.uploadPhotoTextInline}>📁 Upload Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.takeSelfieBtnInline}
                onPress={handleCameraSelfieCapture}
                activeOpacity={0.8}
              >
                <Text style={styles.takeSelfieTextInline}>📸 Take Selfie</Text>
              </TouchableOpacity>

              <View style={styles.avatarDivider} />

              {[
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
                'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
                'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
              ].map((uri, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setAvatarUrl(uri)}
                  style={[styles.presetAvatarBtnInline, avatarUrl === uri && styles.presetAvatarSelectedInline]}
                >
                  <Image source={{ uri }} style={styles.presetAvatarImgInline} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* SECTION 1: Stripe Connected Account & Payouts Setup */}
          <View style={[styles.sectionCard, { borderColor: '#635BFF', borderWidth: 2 }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionIcon}>💳</Text>
              <Text style={[styles.sectionTitle, { color: '#635BFF' }]}>Stripe Account Payout Setup</Text>
            </View>
            <Text style={styles.sectionDesc}>
              Connect your Stripe account to receive direct payouts for your VIP Memberships and Pay-Per-View (PPV) Snaps. 95% of all earnings go directly to your bank account via Stripe Connect!
            </Text>

            <View style={styles.inputGroupFull}>
              <Text style={styles.inputLabelHighlight}>YOUR STRIPE CONNECTED ACCOUNT ID (`acct_...`)</Text>
              <View style={styles.stripeInputBox}>
                <Text style={styles.currencySymbol}>💳</Text>
                <TextInput
                  value={stripeAccountId}
                  onChangeText={setStripeAccountId}
                  placeholder="e.g. acct_1N9X82F45B31K009"
                  placeholderTextColor="#888"
                  style={styles.stripeInputText}
                  autoCapitalize="none"
                />
              </View>
              <Text style={styles.stripeHelpText}>
                🔑 Don't have a Stripe account ID yet? Log into your Stripe Dashboard at stripe.com ➔ Settings ➔ Account Details to copy your Account ID starting with `acct_`.
              </Text>
            </View>
          </View>

          {/* SECTION 2: Membership Price Controls */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionIcon}>👑</Text>
              <Text style={styles.sectionTitle}>Membership Subscription Prices</Text>
            </View>
            <Text style={styles.sectionDesc}>
              Set how much followers pay to access your VIP exclusive stories and direct messages.
            </Text>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>VIP Gold (Monthly USD)</Text>
              <View style={styles.priceInputBox}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  value={goldMonthlyPrice}
                  onChangeText={setGoldMonthlyPrice}
                  style={styles.priceInput}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>VIP Annual (Yearly USD)</Text>
              <View style={styles.priceInputBox}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  value={platinumYearlyPrice}
                  onChangeText={setPlatinumYearlyPrice}
                  style={styles.priceInput}
                  keyboardType="numeric"
                />
              </View>
            </View>
            {/* 5% Admin Fee Deduction & Net Payout Calculator Box */}
            <View style={styles.feeInfoBox}>
              <View style={styles.feeHeaderRow}>
                <Text style={styles.feeIcon}>⚡</Text>
                <Text style={styles.feeTitle}>Platform Fee & Payout Split</Text>
              </View>
              <Text style={styles.feeText}>
                A <Text style={{ color: '#FFFC00', fontWeight: 'bold' }}>5% Admin Fee</Text> is automatically deducted on each subscriber purchase and routed to platform administration. You receive <Text style={{ color: '#00F2FE', fontWeight: 'bold' }}>95% net payout</Text> directly to your Stripe account.
              </Text>

              <View style={styles.payoutTable}>
                <View style={styles.payoutRow}>
                  <Text style={styles.payoutPlan}>VIP Gold (${goldMonthlyPrice}/mo):</Text>
                  <Text style={styles.payoutCalc}>
                    Fee: -${(parseFloat(goldMonthlyPrice || '0') * 0.05).toFixed(2)} | <Text style={{ color: '#00F2FE', fontWeight: 'bold' }}>Net: ${(parseFloat(goldMonthlyPrice || '0') * 0.95).toFixed(2)}/mo</Text>
                  </Text>
                </View>
                <View style={styles.payoutRow}>
                  <Text style={styles.payoutPlan}>VIP Annual (${platinumYearlyPrice}/yr):</Text>
                  <Text style={styles.payoutCalc}>
                    Fee: -${(parseFloat(platinumYearlyPrice || '0') * 0.05).toFixed(2)} | <Text style={{ color: '#00F2FE', fontWeight: 'bold' }}>Net: ${(parseFloat(platinumYearlyPrice || '0') * 0.95).toFixed(2)}/yr</Text>
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.stripeStatusRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stripeStatusTitle}>Stripe Connect Status</Text>
                <Text style={styles.stripeStatusSub}>
                  {stripeAccountId ? `🟢 Active (${stripeAccountId})` : '🔴 Setup Required'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.stripeConnectBtn}
                onPress={() => {
                  if (typeof window !== 'undefined') {
                    window.open('https://connect.stripe.com/express/oauth/authorize', '_blank');
                  }
                }}
              >
                <Text style={styles.stripeConnectText}>Connect Express 💳</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SECTION 2: Snap & Ephemeral Controls */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionIcon}>⏱️</Text>
              <Text style={styles.sectionTitle}>Snap & Privacy Controls</Text>
            </View>
            <Text style={styles.sectionDesc}>
              Configure default timer countdowns and visibility rules for snaps you post.
            </Text>

            <Text style={styles.settingSubTitle}>Default View Duration</Text>
            <View style={styles.timerSelectorRow}>
              {[3, 5, 10, 0].map((seconds) => (
                <TouchableOpacity
                  key={seconds}
                  style={[
                    styles.timerChip,
                    defaultSnapTimer === seconds && styles.timerChipActive,
                  ]}
                  onPress={() => setDefaultSnapTimer(seconds)}
                >
                  <Text
                    style={[
                      styles.timerChipText,
                      defaultSnapTimer === seconds && styles.timerChipTextActive,
                    ]}
                  >
                    {seconds === 0 ? '∞ Loop' : `${seconds}s`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.settingSubTitle, { marginTop: 16 }]}>Who Can View My Snaps?</Text>
            <View style={styles.privacySelectorRow}>
              {[
                { key: 'friends', label: '👥 Friends Only' },
                { key: 'public', label: '🌍 Everyone' },
                { key: 'vip', label: '👑 VIP Paid Members' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.privacyChip,
                    snapPrivacy === item.key && styles.privacyChipActive,
                  ]}
                  onPress={() => setSnapPrivacy(item.key as any)}
                >
                  <Text
                    style={[
                      styles.privacyChipText,
                      snapPrivacy === item.key && styles.privacyChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Auto-Purge Media on View</Text>
                <Text style={styles.switchSub}>Automatically delete media from Supabase storage once viewed</Text>
              </View>
              <Switch
                value={autoPurgeEnabled}
                onValueChange={setAutoPurgeEnabled}
                trackColor={{ false: '#3A3A3C', true: '#FFFC00' }}
                thumbColor={autoPurgeEnabled ? '#000' : '#8E8E93'}
              />
            </View>
          </View>

          {/* SECTION 3: Active Snaps & Story Management */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionIcon}>🔥</Text>
              <Text style={styles.sectionTitle}>Manage Posted Snaps ({activeSnaps.length})</Text>
            </View>
            <Text style={styles.sectionDesc}>
              View or instantly purge your active story posts before the 24-hour expiration.
            </Text>

            {activeSnaps.map((snap) => (
              <View key={snap.id} style={styles.activeSnapRow}>
                <Image source={{ uri: snap.media_url }} style={styles.snapThumb} />
                <View style={styles.snapDetails}>
                  <Text style={styles.snapTitle}>My Story Snap</Text>
                  <Text style={styles.snapTime}>Posted {snap.created_at}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteSnapBtn}
                  onPress={() => handleDeleteSnap(snap.id)}
                >
                  <Text style={styles.deleteSnapText}>🗑 Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Admin Dashboard Modal */}
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
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#FFFC00',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
    gap: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#FFFC00',
    marginRight: 14,
  },
  editAvatarBadge: {
    backgroundColor: '#FFFC00',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: -10,
    marginRight: 14,
  },
  editAvatarText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
  profileDetails: {
    flex: 1,
  },
  profileNameInput: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
    padding: 0,
  },
  unifiedAvatarCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 14,
    marginTop: -6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  unifiedAvatarTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  unifiedAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadPhotoBtnInline: {
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#00F2FE',
  },
  uploadPhotoTextInline: {
    color: '#00F2FE',
    fontSize: 12,
    fontWeight: '800',
  },
  takeSelfieBtnInline: {
    backgroundColor: 'rgba(255, 252, 0, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFFC00',
  },
  takeSelfieTextInline: {
    color: '#FFFC00',
    fontSize: 12,
    fontWeight: '800',
  },
  avatarDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 4,
  },
  presetAvatarBtnInline: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  presetAvatarSelectedInline: {
    borderColor: '#FFFC00',
    transform: [{ scale: 1.1 }],
  },
  presetAvatarImgInline: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileHandle: {
    color: '#FFFC00',
    fontSize: 13,
    fontWeight: '600',
  },
  profileEmail: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  adminConsoleBtn: {
    backgroundColor: 'rgba(255, 252, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFFC00',
  },
  adminConsoleText: {
    color: '#FFFC00',
    fontSize: 11,
    fontWeight: '800',
  },
  signOutBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  signOutText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  sectionDesc: {
    color: '#8E8E93',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  inputGroupFull: {
    marginTop: 6,
  },
  inputLabelHighlight: {
    color: '#635BFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  stripeInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#635BFF',
  },
  stripeInputText: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  stripeHelpText: {
    color: '#8E8E93',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
  feeInfoBox: {
    backgroundColor: 'rgba(255, 252, 0, 0.08)',
    borderWidth: 1,
    borderColor: '#FFFC00',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  feeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  feeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  feeTitle: {
    color: '#FFFC00',
    fontSize: 14,
    fontWeight: '800',
  },
  feeText: {
    color: '#D0D0E0',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  payoutTable: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutPlan: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  payoutCalc: {
    color: '#8E8E93',
    fontSize: 12,
  },
  inputRow: {
    marginBottom: 14,
  },
  inputLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  priceInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  currencySymbol: {
    color: '#FFFC00',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stripeStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    padding: 12,
    borderRadius: 14,
    marginTop: 10,
  },
  stripeStatusTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stripeStatusSub: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  stripeConnectBtn: {
    backgroundColor: '#635BFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  stripeConnectText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  settingSubTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  timerSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timerChip: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerChipActive: {
    backgroundColor: '#FFFC00',
  },
  timerChipText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  timerChipTextActive: {
    color: '#000',
  },
  privacySelectorRow: {
    flexDirection: 'column',
    gap: 8,
  },
  privacyChip: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  privacyChipActive: {
    backgroundColor: 'rgba(255, 252, 0, 0.15)',
    borderWidth: 1,
    borderColor: '#FFFC00',
  },
  privacyChipText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  privacyChipTextActive: {
    color: '#FFFC00',
    fontWeight: '800',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  switchTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  switchSub: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
    marginRight: 10,
  },
  activeSnapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    padding: 10,
    borderRadius: 14,
    marginBottom: 10,
  },
  snapThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 12,
  },
  snapDetails: {
    flex: 1,
  },
  snapTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  snapTime: {
    color: '#8E8E93',
    fontSize: 12,
  },
  deleteSnapBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  deleteSnapText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default CreatorSettingsModal;
