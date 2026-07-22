import re

filepath = "src/components/SnapBar.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Update fetchRole to consolidate user email and force admin detection
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

new_fetch_role = """    const fetchRole = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (user) {
          const emailStr = (user.email || "").toLowerCase();
          setUserEmail(user.email || "");
          setDisplayName(user.user_metadata?.display_name || user.email?.split("@")[0] || "User");

          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          let role = (profile as any)?.role || user.user_metadata?.role;
          if (emailStr.includes("admin") || role === "admin") {
            role = "admin";
          } else if (!role) {
            role = "customer";
          }
          setUserRole(role as any);
        }
      } catch (err) {
        console.error("[SnapBar Role Fetch Error]", err);
      }
    };"""

content = content.replace(old_fetch_role, new_fetch_role)

# 2. Add isAdmin computation and displayRole
old_modal_start = """  const handleProfileClick = () => {"""
new_modal_start = """  const isAdmin = userRole === "admin" || userEmail.toLowerCase().includes("admin");
  const displayRole = isAdmin ? "ADMIN" : userRole.toUpperCase();

  const handleProfileClick = () => {"""

content = content.replace(old_modal_start, new_modal_start)

# 3. Update roleTagText and menuActionsGroup in Profile Menu Modal
old_tag_text = "<Text style={styles.roleTagText}>{userRole.toUpperCase()}</Text>"
new_tag_text = "<Text style={styles.roleTagText}>{displayRole}</Text>"
content = content.replace(old_tag_text, new_tag_text)

old_actions_cond = "{(userRole === \"admin\" || userEmail.includes(\"admin\")) ?"
new_actions_cond = "{isAdmin ?"
content = content.replace(old_actions_cond, new_actions_cond)

with open(filepath, "w") as f:
    f.write(content)

print("SnapBar.tsx force admin detection updated successfully!")
