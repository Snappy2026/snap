import re

# 1. Patch handleAdminLogin in AuthScreen.tsx
auth_filepath = "src/screens/AuthScreen.tsx"
with open(auth_filepath, "r") as f:
    auth_code = f.read()

old_admin_login = """  const handleAdminLogin = async () => {
    setEmail("admin@adultplus.com");
    setPassword("admin123");
    try {
      await supabase.auth.signUp({
        email: "admin@adultplus.com",
        password: "admin123",
        options: {
          data: {
            username: "master_admin",
            display_name: "Platform Master Admin",
          },
        },
      });
      await supabase.auth.signInWithPassword({
        email: "admin@adultplus.com",
        password: "admin123",
      });
    } catch (e) {
      console.log("[Admin Register Notice]", e);
    }
    if (onEnableDemoMode) onEnableDemoMode();
    navigation.replace("MainTabs", { screen: "Camera" });
  };"""

new_admin_login = """  const handleAdminLogin = async () => {
    setEmail("admin@adultplus.com");
    setPassword("admin123");
    setLoading(true);
    try {
      let { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: "admin@adultplus.com",
        password: "admin123",
      });

      let userId = signInData?.user?.id;

      if (signInErr || !userId) {
        const { data: signUpData } = await supabase.auth.signUp({
          email: "admin@adultplus.com",
          password: "admin123",
          options: {
            data: {
              username: "master_admin",
              display_name: "Platform Master Admin",
              role: "admin",
            },
          },
        });
        userId = signUpData?.user?.id;

        const { data: reSignIn } = await supabase.auth.signInWithPassword({
          email: "admin@adultplus.com",
          password: "admin123",
        });
        if (reSignIn?.user) userId = reSignIn.user.id;
      }

      if (userId) {
        await (supabase.from("profiles") as any).upsert({
          id: userId,
          username: "master_admin",
          display_name: "Platform Master Admin",
          role: "admin",
          updated_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.log("[Admin Register Notice]", e);
    } finally {
      setLoading(false);
    }
    if (onEnableDemoMode) onEnableDemoMode();
    navigation.replace("MainTabs", { screen: "Camera" });
  };"""

auth_code = auth_code.replace(old_admin_login, new_admin_login)

with open(auth_filepath, "w") as f:
    f.write(auth_code)

print("AuthScreen.tsx handleAdminLogin updated to strictly write role: 'admin' to profiles table!")

# 2. Patch SnapBar.tsx to strictly enforce admin role for admin email & profile
snapbar_filepath = "src/components/SnapBar.tsx"
with open(snapbar_filepath, "r") as f:
    snap_code = f.read()

old_fetch_role = """    const fetchRole = async () => {
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

          let role = (profile as any)?.role || user.user_metadata?.role;
          if (!role || user.email?.includes("admin")) {
            role = "admin";
          }
          setUserRole(role as any);
        }
      } catch (err) {
        console.error("[SnapBar Role Fetch Error]", err);
      }
    };"""

snap_code = snap_code.replace(old_fetch_role, new_fetch_role)

# Also ensure Profile Menu Modal displays ADMIN and Master Admin Console button if user email contains admin
old_menu_actions = """              <View style={styles.menuActionsGroup}>
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
                ) : ("""

new_menu_actions = """              <View style={styles.menuActionsGroup}>
                {(userRole === "admin" || userEmail.includes("admin")) ? (
                  <>
                    <TouchableOpacity
                      style={styles.adminConsoleMenuBtn}
                      onPress={() => {
                        setShowProfileModal(false);
                        setShowAdminModal(true);
                      }}
                    >
                      <Text style={styles.adminConsoleMenuText}>🛡️ Open Master Admin Console</Text>
                    </TouchableOpacity>
                  </>
                ) : ("""

snap_code = snap_code.replace(old_menu_actions, new_menu_actions)

with open(snapbar_filepath, "w") as f:
    f.write(snap_code)

print("SnapBar.tsx updated to enforce Admin role and display Master Admin Console button!")
