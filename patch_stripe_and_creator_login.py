import re

# 1. Update VipMembersScreen.tsx - Direct VIP Activation (No Stripe Redirect)
vip_filepath = "src/screens/VipMembersScreen.tsx"
with open(vip_filepath, "r") as f:
    vip_code = f.read()

old_vip_handler = """  const handleUnlockVip = async (plan: "gold" | "platinum", priceLabel: string) => {
    setPurchasing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user;

      let creatorStripeAccountId: string | undefined = undefined;

      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("stripe_account_id")
          .eq("id", currentUser.id)
          .single();
        if (profile && (profile as any).stripe_account_id) {
          creatorStripeAccountId = (profile as any).stripe_account_id;
        }
      }

      // Redirect directly to Stripe Connect Checkout Session
      await launchStripeCheckout(
        plan,
        currentUser?.id || "demo-user",
        creatorStripeAccountId,
      );
    } catch (err: unknown) {
      console.error("[Stripe Checkout Exception]", err);
      if (typeof window !== "undefined") {
        window.open("https://checkout.stripe.com", "_blank");
      }
    } finally {
      setPurchasing(false);
    }
  };"""

new_vip_handler = """  const handleUnlockVip = async (plan: "gold" | "platinum", priceLabel: string) => {
    setPurchasing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user;

      if (currentUser) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await (supabase.from("profiles") as any).upsert({
          id: currentUser.id,
          is_vip_member: true,
          vip_tier: plan.toUpperCase(),
          vip_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      setIsVipMember(true);
      const msg = `Welcome to Adult+ VIP Members Lounge! Your ${plan.toUpperCase()} membership is active.`;
      if (typeof window !== "undefined") {
        window.alert(msg);
      } else {
        Alert.alert("VIP Membership Unlocked! 👑", msg);
      }
    } catch (err: any) {
      console.error("[VIP Unlock Error]", err);
    } finally {
      setPurchasing(false);
    }
  };"""

vip_code = vip_code.replace(old_vip_handler, new_vip_handler)

with open(vip_filepath, "w") as f:
    f.write(vip_code)

# 2. Update SnapViewerScreen.tsx - Direct PPV Snap Unlock (No Stripe Redirect)
snap_filepath = "src/screens/SnapViewerScreen.tsx"
with open(snap_filepath, "r") as f:
    snap_code = f.read()

old_ppv_handler = """        if (currentSnap.is_pay_per_view && !currentSnap.viewed_at) {
          launchPpvCheckout(
            currentSnap.id,
            currentSnap.price_amount || 4.99,
            currentSnap.sender_id,
          );
          return;
        }"""

new_ppv_handler = """        if (currentSnap.is_pay_per_view && !currentSnap.viewed_at) {
          // Direct PPV Snap Unlock without Stripe redirect
          await (supabase.from("snaps") as any)
            .update({ viewed_at: new Date().toISOString() })
            .eq("id", currentSnap.id);
          setCurrentSnap(prev => prev ? { ...prev, viewed_at: new Date().toISOString() } : null);
          return;
        }"""

snap_code = snap_code.replace(old_ppv_handler, new_ppv_handler)

with open(snap_filepath, "w") as f:
    f.write(snap_code)

# 3. Clean AdminDashboardModal.tsx fake KPI values
admin_filepath = "src/components/AdminDashboardModal.tsx"
with open(admin_filepath, "r") as f:
    admin_code = f.read()

# Replace fake KPI values and initial states
admin_code = admin_code.replace("{usersList.length || 4}", "{usersList.length}")
admin_code = admin_code.replace("{creatorsList.length || 2}", "{creatorsList.length}")
admin_code = admin_code.replace("const [totalVolume, setTotalVolume] = useState(2737.7);", "const [totalVolume, setTotalVolume] = useState(0.00);")
admin_code = admin_code.replace("const [totalAdminFee, setTotalAdminFee] = useState(136.89);", "const [totalAdminFee, setTotalAdminFee] = useState(0.00);")

with open(admin_filepath, "w") as f:
    f.write(admin_code)

# 4. Update AuthScreen.tsx to show CreatorOnboardingModal on Creator Login as well
auth_filepath = "src/screens/AuthScreen.tsx"
with open(auth_filepath, "r") as f:
    auth_code = f.read()

old_login_block = """        if (onEnableDemoMode) onEnableDemoMode();
        navigation.replace("MainTabs", { screen: "Camera" });"""

# We check if user is a creator on login and pop the onboarding modal
new_login_block = """        const { data: profile } = await supabase
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
        }"""

auth_code = auth_code.replace(old_login_block, new_login_block, 1)

with open(auth_filepath, "w") as f:
    f.write(auth_code)

print("Stripe payments bypassed, Admin KPIs cleaned, and Creator login onboarding enabled!")
