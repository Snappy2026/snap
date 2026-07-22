import re
import os

vip_filepath = "src/screens/VipMembersScreen.tsx"
with open(vip_filepath, "r") as f:
    content = f.read()

# 1. Empty DEMO_VIP_STORIES
content = re.sub(r'const DEMO_VIP_STORIES: VipContentItem\[\] = \[.*?\];', 'const DEMO_VIP_STORIES: VipContentItem[] = [];', content, flags=re.DOTALL)

# 2. Add state for vip content and fetch it
# Find: const [purchasing, setPurchasing] = useState(false);
state_idx = content.find('const [purchasing, setPurchasing] = useState(false);')
if state_idx != -1:
    new_state = 'const [purchasing, setPurchasing] = useState(false);\n  const [vipStories, setVipStories] = useState<VipContentItem[]>([]);\n\n  useEffect(() => {\n    const fetchVip = async () => {\n      const { data } = await supabase.from("vip_content").select("*, creator_profile:profiles(*)");\n      if (data) setVipStories(data as VipContentItem[]);\n    };\n    fetchVip();\n  }, []);\n'
    content = content[:state_idx] + new_state + content[state_idx + len('const [purchasing, setPurchasing] = useState(false);'):]

# 3. Replace DEMO_VIP_STORIES.map with vipStories.map
content = content.replace("DEMO_VIP_STORIES.map", "vipStories.map")

with open(vip_filepath, "w") as f:
    f.write(content)

print("VipMembersScreen.tsx updated!")
