import re

filepath = "src/screens/AuthScreen.tsx"
with open(filepath, "r") as f:
    content = f.read()

old_signup_block = """      } else {
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
        }"""

new_signup_block = """      } else {
        // Pre-check if username handle is already registered in profiles
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username.trim())
          .maybeSingle();

        if (existingUser) {
          showAlert("Username Taken", "This username handle is already taken. Please choose a different username.");
          setLoading(false);
          return;
        }

        // Strict Sign Up via Supabase Auth
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
          if (error.message.toLowerCase().includes("rate limit") || error.status === 429) {
            showAlert("Email Already Submitted", "This email address is already registered or submitted. Please log in with your email and password.");
          } else {
            showAlert("Sign Up Notice", error.message || "Could not register account. Email may already be registered.");
          }
          setLoading(false);
          return;
        }

        // Check if user already exists (Supabase returns empty identities array for existing emails)
        if (signUpData?.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
          showAlert("Email Already Registered", "An account with this email address already exists. Please tap LOG IN above.");
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
        }"""

content = content.replace(old_signup_block, new_signup_block)

with open(filepath, "w") as f:
    f.write(content)

print("AuthScreen.tsx signup error handling & rate limit checks updated!")
