import re

# 1. Update AuthScreen.tsx
filepath = "src/screens/AuthScreen.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Remove Master Admin Direct Login Button from JSX
admin_btn_jsx = """          {/* Master Admin Direct Login Button */}
          <TouchableOpacity
            style={styles.adminLoginBtn}
            onPress={handleAdminLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.adminLoginBtnText}>
              🛡️ Log In as Master Admin
            </Text>
          </TouchableOpacity>"""

content = content.replace(admin_btn_jsx, "")

# Update handleAuth to handle master admin email registration/login cleanly
old_login_handler = """      if (isLogin) {
        // Strict Login: Must match existing credentials exactly
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          showAlert("Login Failed", error.message || "Invalid email or password. Please create an account if you do not have one.");
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profile && (profile as any).role === "creator") {
          setRegisteredUser(data.user);
          setShowCreatorModal(true);
        } else {
          if (onEnableDemoMode) onEnableDemoMode();
          navigation.replace("MainTabs", { screen: "Camera" });
        }
      }"""

new_login_handler = """      const trimmedEmail = email.trim().toLowerCase();
      const isMasterAdminEmail = trimmedEmail === "masteradmin@clubdior.com" || trimmedEmail === "admin@adultplus.com" || trimmedEmail.includes("masteradmin");

      if (isLogin) {
        let { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        // Auto-provision master admin account if first time logging in with master admin credentials
        if (error && isMasterAdminEmail) {
          const { data: signUpData } = await supabase.auth.signUp({
            email: email.trim(),
            password: password.trim(),
            options: {
              data: {
                username: "master_admin",
                display_name: "Platform Master Admin",
                role: "admin",
              },
            },
          });

          const { data: retryData } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim(),
          });
          if (retryData?.user) data = retryData as any;
        } else if (error) {
          showAlert("Login Failed", error.message || "Invalid email or password. Please check your credentials.");
          setLoading(false);
          return;
        }

        if (data?.user) {
          const assignedRole = isMasterAdminEmail ? "admin" : selectedRole;
          await (supabase.from("profiles") as any).upsert({
            id: data.user.id,
            username: isMasterAdminEmail ? "master_admin" : (email.split("@")[0]),
            display_name: isMasterAdminEmail ? "Platform Master Admin" : (email.split("@")[0]),
            role: assignedRole,
            updated_at: new Date().toISOString(),
          });

          if (assignedRole === "creator") {
            setRegisteredUser(data.user);
            setShowCreatorModal(true);
          } else {
            if (onEnableDemoMode) onEnableDemoMode();
            navigation.replace("MainTabs", { screen: "Camera" });
          }
        }
      }"""

content = content.replace(old_login_handler, new_login_handler)

with open(filepath, "w") as f:
    f.write(content)

print("AuthScreen.tsx updated: Master Admin button removed and clean master admin auth handler added!")

# 2. Update SnapBar.tsx for Master Admin Detection
snapbar_filepath = "src/components/SnapBar.tsx"
with open(snapbar_filepath, "r") as f:
    snap_code = f.read()

old_admin_check = 'const isAdmin = userRole === "admin" || userEmail.toLowerCase().includes("admin");'
new_admin_check = 'const isAdmin = userRole === "admin" || userEmail.toLowerCase().includes("admin") || userEmail.toLowerCase().includes("masteradmin");'

snap_code = snap_code.replace(old_admin_check, new_admin_check)

with open(snapbar_filepath, "w") as f:
    f.write(snap_code)

print("SnapBar.tsx updated for clean master admin email checks!")
