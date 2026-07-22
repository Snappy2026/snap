import re

# 1. Update StoriesScreen.tsx
filepath = "src/screens/StoriesScreen.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Remove DEBUG UI
debug_ui_start = content.find("{/* DEBUG TOGGLE UI FOR TESTING */}")
if debug_ui_start != -1:
    debug_ui_end = content.find("      {/* On web: use native HTML scroll containers", debug_ui_start)
    if debug_ui_end != -1:
        content = content[:debug_ui_start] + content[debug_ui_end:]

# Empty the Demo Arrays
content = re.sub(r'const FRIEND_STORIES: FriendStoryItem\[\] = \[.*?\];', 'const FRIEND_STORIES: FriendStoryItem[] = [];', content, flags=re.DOTALL)
content = re.sub(r'const SUBSCRIPTIONS: Subscription\[\] = \[.*?\];', 'const SUBSCRIPTIONS: Subscription[] = [];', content, flags=re.DOTALL)
content = re.sub(r'const FOR_YOU: DiscoverItem\[\] = \[.*?\];', 'const FOR_YOU: DiscoverItem[] = [];', content, flags=re.DOTALL)

with open(filepath, "w") as f:
    f.write(content)

# 2. Update VipMembersScreen.tsx
vip_filepath = "src/screens/VipMembersScreen.tsx"
with open(vip_filepath, "r") as f:
    vip_content = f.read()

vip_content = re.sub(r'const DEMO_VIP_STORIES: VipContentItem\[\] = \[.*?\];', 'const DEMO_VIP_STORIES: VipContentItem[] = [];', vip_content, flags=re.DOTALL)

# But VipMembersScreen doesn't fetch vip_content. It relies entirely on DEMO_VIP_STORIES.
# Let's see if we should fetch it. The user said:
# "and i am still see fake stories and in the gallery and vip - shouldnt the data be clean ? or did we not do that bit"
# The VIP Members Screen SHOULD show real VIP content for the creator.
# Let's actually add the fetch logic to VipMembersScreen.tsx.
