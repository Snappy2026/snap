import re

filepath = "src/components/SnapBar.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Update fetchRole to check profiles table for role
old_fetch_role = """    const fetchRole = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (user) {
          const role =
            user.user_metadata?.role ||
            (user.email?.includes("admin") ? "admin" : "customer");
          setUserRole(role);
        }
      } catch (err) {
        console.error("[SnapBar Role Fetch Error]", err);
      }
    };"""

new_fetch_role = """    const fetchRole = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          const role =
            (profile as any)?.role ||
            user.user_metadata?.role ||
            (user.email?.includes("admin") ? "admin" : "customer");
          setUserRole(role as any);
        }
      } catch (err) {
        console.error("[SnapBar Role Fetch Error]", err);
      }
    };"""

content = content.replace(old_fetch_role, new_fetch_role)

# 2. Update Profile Menu Modal actions to handle admin role
old_menu_actions = """              <View style={styles.menuActionsGroup}>
                <TouchableOpacity
                  style={styles.menuActionBtn}
                  onPress={() => {
                    setShowProfileModal(false);
                    if (userRole === "customer") setShowCustomerModal(true);
                    else setShowSettingsModal(true);
                  }}
                >
                  <Text style={styles.menuActionText}>⚙️ Account Settings & Payouts</Text>
                </TouchableOpacity>"""

new_menu_actions = """              <View style={styles.menuActionsGroup}>
                {userRole === "admin" ? (
                  <TouchableOpacity
                    style={styles.adminConsoleMenuBtn}
                    onPress={() => {
                      setShowProfileModal(false);
                      setShowAdminModal(true);
                    }}
                  >
                    <Text style={styles.adminConsoleMenuText}>🛡️ Open Master Admin Console</Text>
                  </TouchableOpacity>
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
                )}"""

content = content.replace(old_menu_actions, new_menu_actions)

# Add adminConsoleMenuBtn style definition
old_styles_anchor = "  modalOverlay: {"
new_styles = """  adminConsoleMenuBtn: {
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
  modalOverlay: {"""

content = content.replace(old_styles_anchor, new_styles)

with open(filepath, "w") as f:
    f.write(content)

print("SnapBar.tsx updated so Admin avatar click opens Master Admin Console directly!")
