import re

filepath = 'src/screens/StoriesScreen.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Add followedCreatorIds state
state_pattern = "  const [userRole, setUserRole] = useState<'admin' | 'creator' | 'customer'>('customer');"
state_replacement = "  const [userRole, setUserRole] = useState<'admin' | 'creator' | 'customer'>('customer');\n  const [followedCreatorIds, setFollowedCreatorIds] = useState<string[]>([]);"
content = content.replace(state_pattern, state_replacement)

# 2. Fetch friendships and filter
fetch_start_pattern = "        const { data: userData } = await supabase.auth.getUser();"
fetch_start_replacement = """        const { data: userData } = await supabase.auth.getUser();
        
        let localFollowedIds: string[] = [];
        if (userData?.user) {
          const { data: follows } = await supabase
            .from("friendships")
            .select("addressee_id")
            .eq("requester_id", userData.user.id)
            .eq("status", "accepted");
          if (follows) {
            localFollowedIds = follows.map(f => f.addressee_id);
            setFollowedCreatorIds(localFollowedIds);
          }
        }"""
content = content.replace(fetch_start_pattern, fetch_start_replacement)

# 3. Filter vipData
vip_mapping_pattern = "        if (vipData) {\n          const mappedVip: VipContentItem[] = vipData.map((item: any) => ({"
vip_mapping_replacement = """        if (vipData) {
          let filteredVip = vipData;
          if (profileData?.role === 'creator') {
            filteredVip = vipData.filter((item: any) => item.creator_id === user.id);
          } else if (profileData?.role === 'customer') {
            if (localFollowedIds.length > 0) {
              filteredVip = vipData.filter((item: any) => localFollowedIds.includes(item.creator_id));
            }
          }
          
          const mappedVip: VipContentItem[] = filteredVip.map((item: any) => ({"""
content = content.replace(vip_mapping_pattern, vip_mapping_replacement)

# 4. Sort stories
stories_mapping_pattern = "        if (stories) {\n          const mappedStories = stories.map((s: any) => ({"
stories_mapping_replacement = """        if (stories) {
          let sortedStories = [...stories];
          if (profileData?.role === 'customer' && localFollowedIds.length > 0) {
            sortedStories.sort((a: any, b: any) => {
              const aFollows = localFollowedIds.includes(a.user_id);
              const bFollows = localFollowedIds.includes(b.user_id);
              if (aFollows && !bFollows) return -1;
              if (!aFollows && bFollows) return 1;
              return 0;
            });
          }

          const mappedStories = sortedStories.map((s: any) => ({"""
content = content.replace(stories_mapping_pattern, stories_mapping_replacement)

# 5. Handle Upload Limit
upload_start_pattern = "    try {\n      setUploading(true);"
upload_start_replacement = """    try {
      if (userRole === 'customer' && !isVipMember) {
        const { count, error } = await supabase
          .from("stories")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", currentUserId);
        
        if (count && count >= 1) {
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.alert("Free followers can only upload 1 photo. Upgrade to VIP to upload more.");
          } else {
            Alert.alert("Upload Limit", "Free followers can only upload 1 photo. Upgrade to VIP to upload more.");
          }
          return;
        }
      }

      setUploading(true);"""
content = content.replace(upload_start_pattern, upload_start_replacement)

with open(filepath, 'w') as f:
    f.write(content)

print("StoriesScreen updated successfully.")
