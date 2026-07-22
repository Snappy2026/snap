import re

# 1. Update AuthScreen.tsx
auth_filepath = "src/screens/AuthScreen.tsx"
with open(auth_filepath, "r") as f:
    auth_code = f.read()

# Remove adminCredsBox and skipBtn (Guest Login)
old_bottom_jsx = """          <View style={styles.adminCredsBox}>
            <Text style={styles.adminCredsTitle}>🔑 Admin Login Details:</Text>
            <Text style={styles.adminCredsText}>
              Email:{" "}
              <Text style={{ color: "#D4AF37" }}>admin@adultplus.com</Text>
            </Text>
            <Text style={styles.adminCredsText}>
              Password: <Text style={{ color: "#D4AF37" }}>admin123</Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkipDemo}>
            <Text style={styles.skipBtnText}>Continue as Guest ⚡️</Text>
          </TouchableOpacity>"""

auth_code = auth_code.replace(old_bottom_jsx, "")

# Change yellow text colors to white in AuthScreen styles
auth_code = auth_code.replace('activeTabText: {\n    color: "#D4AF37",', 'activeTabText: {\n    color: "#FFFFFF",')
auth_code = auth_code.replace('selectedRoleTextCreator: {\n    color: "#D4AF37",', 'selectedRoleTextCreator: {\n    color: "#FFFFFF",')
auth_code = auth_code.replace('submitBtnText: {\n    color: "#D4AF37",', 'submitBtnText: {\n    color: "#FFFFFF",')
auth_code = auth_code.replace('adminLoginBtnText: {\n    color: "#D4AF37",', 'adminLoginBtnText: {\n    color: "#FFFFFF",')

with open(auth_filepath, "w") as f:
    f.write(auth_code)

print("AuthScreen.tsx updated: admin details box & guest login removed, yellow fonts changed to white!")

# 2. Update SnapBar.tsx for Profile Menu Modal with Log Out button
snapbar_filepath = "src/components/SnapBar.tsx"
with open(snapbar_filepath, "r") as f:
    snap_code = f.read()

# Add useNavigation import if needed
if "useNavigation" not in snap_code:
    snap_code = snap_code.replace(
        'import { supabase } from "../lib/supabase";',
        'import { useNavigation } from "@react-navigation/native";\nimport { supabase } from "../lib/supabase";'
    )

# Add showProfileModal state and handleProfileClick implementation
old_profile_click = """  const handleProfileClick = () => {
    if (onProfilePress) {
      onProfilePress();
    } else if (userRole === "customer") {
      setShowCustomerModal(true);
    } else {
      // For Admin & Creator, open normal profile pic upload & account settings
      setShowSettingsModal(true);
    }
  };"""

new_profile_click = """  const navigation = useNavigation<any>();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [displayName, setDisplayName] = useState("User");

  React.useEffect(() => {
    const fetchUserData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        setUserEmail(userData.user.email || "");
        setDisplayName(userData.user.user_metadata?.display_name || userData.user.email?.split("@")[0] || "User");
      }
    };
    fetchUserData();
  }, []);

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
  };"""

snap_code = snap_code.replace(old_profile_click, new_profile_click)

# Add Profile Modal JSX into SnapBar return
old_modal_anchor = "{showStudioModal && ("
new_profile_modal_jsx = """{showProfileModal && (
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
                  <Text style={styles.roleTagText}>{userRole.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.menuActionsGroup}>
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

      {showStudioModal && ("""

snap_code = snap_code.replace(old_modal_anchor, new_profile_modal_jsx)

# Add styles for profile menu modal
old_snapbar_styles = "  profileButton: {"
new_snapbar_styles = """  modalOverlay: {
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
  profileButton: {"""

snap_code = snap_code.replace(old_snapbar_styles, new_snapbar_styles)

# Change yellow fonts to white in SnapBar as well
snap_code = snap_code.replace('color: "#D4AF37"', 'color: "#FFFFFF"')

with open(snapbar_filepath, "w") as f:
    f.write(snap_code)

print("SnapBar.tsx updated: Profile Menu Modal with Log Out button added, yellow fonts changed to white!")
