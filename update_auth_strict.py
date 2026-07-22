import re

filepath = "src/screens/AuthScreen.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Add import CreatorOnboardingModal
if "CreatorOnboardingModal" not in content:
    content = content.replace(
        'import { supabase } from "../lib/supabase";',
        'import { supabase } from "../lib/supabase";\nimport { CreatorOnboardingModal } from "../components/CreatorOnboardingModal";'
    )

# Add states for creator modal
state_anchor = 'const [loading, setLoading] = useState(false);'
new_states = """const [loading, setLoading] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<any>(null);"""
content = content.replace(state_anchor, new_states)

# Replace handleAuth with strict implementation
old_handle_auth = """  const handleAuth = async () => {
    if (!email || !password) {
      showAlert("Required Fields", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        let { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          const { error: signUpErr } = await supabase.auth.signUp({
            email: email.trim(),
            password: password.trim(),
            options: {
              data: {
                username: email.split("@")[0],
                display_name: email.split("@")[0],
                role: email.includes("admin") ? "admin" : selectedRole,
              },
            },
          });
          if (signUpErr) throw signUpErr;
        }

        if (onEnableDemoMode) onEnableDemoMode();
        navigation.replace("MainTabs", { screen: "Camera" });
      } else {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              username: username.trim() || email.split("@")[0],
              display_name:
                displayName.trim() || username.trim() || email.split("@")[0],
              role: selectedRole,
            },
          },
        });
        if (error) throw error;

        if (signUpData?.user) {
          await (supabase.from("profiles") as any).upsert({
            id: signUpData.user.id,
            username: username.trim() || email.split("@")[0],
            display_name:
              displayName.trim() || username.trim() || email.split("@")[0],
            role: selectedRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        if (onEnableDemoMode) onEnableDemoMode();
        navigation.replace("MainTabs", { screen: "Camera" });
      }
    } catch (err: unknown) {
      console.error("[Auth Exception]", err);
      if (onEnableDemoMode) onEnableDemoMode();
      navigation.replace("MainTabs", { screen: "Camera" });
    } finally {
      setLoading(false);
    }
  };"""

new_handle_auth = """  const handleAuth = async () => {
    if (!email || !password) {
      showAlert("Required Fields", "Please enter your email and password.");
      return;
    }

    if (!isLogin && (!username || !displayName)) {
      showAlert("Missing Details", "Please enter a username handle and display name to create your account.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
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

        if (onEnableDemoMode) onEnableDemoMode();
        navigation.replace("MainTabs", { screen: "Camera" });
      } else {
        // Strict Sign Up
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              username: username.trim(),
              display_name: displayName.trim(),
              role: selectedRole,
            },
          },
        });

        if (error) {
          showAlert("Sign Up Error", error.message || "Could not register account. Email may already be registered.");
          setLoading(false);
          return;
        }

        if (signUpData?.user) {
          await (supabase.from("profiles") as any).upsert({
            id: signUpData.user.id,
            username: username.trim(),
            display_name: displayName.trim(),
            role: selectedRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        if (selectedRole === "creator") {
          setRegisteredUser(signUpData?.user || { id: signUpData?.user?.id, email: email.trim() });
          setShowCreatorModal(true);
        } else {
          if (onEnableDemoMode) onEnableDemoMode();
          navigation.replace("MainTabs", { screen: "Camera" });
        }
      }
    } catch (err: any) {
      console.error("[Auth Exception]", err);
      showAlert("Authentication Error", err?.message || "An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };"""

content = content.replace(old_handle_auth, new_handle_auth)

# Add CreatorOnboardingModal inside JSX return
jsx_target = "</SafeAreaView>"
modal_jsx = """      <CreatorOnboardingModal
        visible={showCreatorModal}
        userId={registeredUser?.id}
        userEmail={registeredUser?.email}
        onClose={() => {
          setShowCreatorModal(false);
          if (onEnableDemoMode) onEnableDemoMode();
          navigation.replace("MainTabs", { screen: "Camera" });
        }}
      />
    </SafeAreaView>"""

content = content.replace(jsx_target, modal_jsx)

with open(filepath, "w") as f:
    f.write(content)

print("AuthScreen.tsx updated with strict auth & creator modal!")
