import re
import os

filepath = "src/components/AdminDashboardModal.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Empty DEMO_USERS and DEMO_CREATORS
content = re.sub(r'const DEMO_USERS: Profile\[\] = \[.*?\];', 'const DEMO_USERS: Profile[] = [];', content, flags=re.DOTALL)
content = re.sub(r'const DEMO_CREATORS: AdminCreatorItem\[\] = \[.*?\];', 'const DEMO_CREATORS: AdminCreatorItem[] = [];', content, flags=re.DOTALL)

# 2. Fix the fetchAdminData logic
fetch_old = """    const fetchAdminData = async () => {
      try {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (profilesData && profilesData.length > 0) {
          setUsersList(profilesData as Profile[]);
        } else {
          setUsersList(DEMO_USERS);
        }
        setCreatorsList(DEMO_CREATORS);
      } catch (err) {
        console.error("[Admin Console Load Error]", err);
        setUsersList(DEMO_USERS);
        setCreatorsList(DEMO_CREATORS);
      } finally {
        setLoading(false);
      }
    };"""

fetch_new = """    const fetchAdminData = async () => {
      try {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (profilesData) {
          setUsersList(profilesData as Profile[]);
          const creators = profilesData.filter((p: any) => p.role === "creator").map((p: any) => ({
            id: p.id,
            display_name: p.display_name,
            username: p.username,
            avatar_url: p.avatar_url,
            stripe_account_id: p.stripe_account_id,
            custom_gold_price: p.custom_gold_price,
            total_subscribers: 0,
            total_revenue: 0,
            admin_fee_earned: 0,
          }));
          setCreatorsList(creators);
        }
      } catch (err) {
        console.error("[Admin Console Load Error]", err);
      } finally {
        setLoading(false);
      }
    };"""

content = content.replace(fetch_old, fetch_new)

with open(filepath, "w") as f:
    f.write(content)

print("AdminDashboardModal.tsx updated!")
