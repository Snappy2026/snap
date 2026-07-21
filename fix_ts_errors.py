import re

filepath = 'src/screens/StoriesScreen.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Add setFollowedCreatorIds
content = content.replace(
    '  const [userRole, setUserRole] = useState("customer");',
    '  const [userRole, setUserRole] = useState("customer");\n  const [followedCreatorIds, setFollowedCreatorIds] = useState<string[]>([]);'
)

# 2. Fix addressee_id type inference by casting to any
content = content.replace(
    '.from("friendships")',
    '(supabase.from("friendships") as any)'
)

# 3. Add TS any cast to follows.map
content = content.replace(
    'follows.map((f) => f.addressee_id)',
    'follows.map((f: any) => f.addressee_id)'
)

# Wait, `supabase.from("friendships")` was replaced above, but `await supabase(supabase.from...` might happen if I just replace `.from("friendships")`.
# Let's fix that. I'll just use regex.
content = re.sub(r'await supabase\s*\n?\s*\.from\("friendships"\)', 'await (supabase.from("friendships") as any)', content)
# And the localFollowedIds map
content = re.sub(r'follows\.map\(\(f\) => f\.addressee_id\)', 'follows.map((f: any) => f.addressee_id)', content)

with open(filepath, 'w') as f:
    f.write(content)

filepath = 'src/components/StoryViewerModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Move checkFollowStatus useEffect AFTER currentStory declaration
# Find currentStory definition
current_story_def = """  const fallbackStory: StoryViewerItem = {
    id: 'demo-story',
    media_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    media_type: 'image',
    user_profile: { display_name: 'Snapchat Story' },
  };

  const activeStories = stories && stories.length > 0 ? stories : [fallbackStory];
  const currentStory = activeStories[currentIndex] || activeStories[0] || fallbackStory;"""

content = content.replace(current_story_def, "")

# Move it before the checkFollowStatus useEffect
check_follow_effect = "  useEffect(() => {\n    const checkFollowStatus = async () => {"
content = content.replace(check_follow_effect, current_story_def + "\n\n" + check_follow_effect)

# 2. Fix TS error for supabase insert in StoryViewerModal
content = content.replace(
    "await supabase.from('friendships').insert({",
    "await (supabase.from('friendships') as any).insert({"
)
content = content.replace(
    "const { data, error } = await supabase\n          .from('friendships')",
    "const { data, error } = await (supabase.from('friendships') as any)"
)
# Also fix any single line version
content = content.replace(
    "const { data, error } = await supabase.from('friendships')",
    "const { data, error } = await (supabase.from('friendships') as any)"
)

with open(filepath, 'w') as f:
    f.write(content)

print("TS errors fixed.")
