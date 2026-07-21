import re

filepath = 'src/components/StoryViewerModal.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Add user_id to StoryViewerItem
content = content.replace("  media_url: string;", "  user_id?: string;\n  media_url: string;")

# 2. Import supabase
if "import { supabase }" not in content:
    content = content.replace("import { Video, ResizeMode } from 'expo-av';", "import { Video, ResizeMode } from 'expo-av';\nimport { supabase } from '../lib/supabase';")

# 3. Add states and useEffect for follow logic
follow_logic = """
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'creator' | 'customer'>('customer');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
        setUserRole(data.user.user_metadata?.role || 'customer');
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUserId || !currentStory.user_id) {
        setIsFollowing(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('friendships')
          .select('id')
          .eq('requester_id', currentUserId)
          .eq('addressee_id', currentStory.user_id)
          .eq('status', 'accepted')
          .maybeSingle();
        
        setIsFollowing(!!data && !error);
      } catch (err) {
        console.error(err);
      }
    };
    
    if (visible) {
      checkFollowStatus();
    }
  }, [visible, currentStory.id, currentUserId]);

  const handleFollow = async () => {
    if (!currentUserId || !currentStory.user_id) return;
    setIsFollowingLoading(true);
    try {
      await supabase.from('friendships').insert({
        requester_id: currentUserId,
        addressee_id: currentStory.user_id,
        status: 'accepted'
      });
      setIsFollowing(true);
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setIsFollowingLoading(false);
    }
  };
"""
content = content.replace("  const progress = useSharedValue(0);", "  const progress = useSharedValue(0);\n" + follow_logic)

# 4. Web Follow Button
web_author_block = """          <span style={{ color: '#FFF', fontSize: '15px', fontWeight: 'bold' }}>
            {currentStory.user_profile?.display_name || 'Snapchat Story'}
          </span>"""
web_follow_button = """          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#FFF', fontSize: '15px', fontWeight: 'bold' }}>
              {currentStory.user_profile?.display_name || 'Snapchat Story'}
            </span>
            {userRole === 'customer' && !isFollowing && currentStory.user_id && currentStory.user_id !== currentUserId && (
              <button
                type="button"
                onClick={handleFollow}
                disabled={isFollowingLoading}
                style={{
                  background: '#FFFC00', color: '#000', border: 'none',
                  padding: '4px 12px', borderRadius: '12px', fontSize: '12px',
                  fontWeight: 'bold', cursor: 'pointer', zIndex: 30
                }}
              >
                {isFollowingLoading ? '...' : 'Follow'}
              </button>
            )}
          </div>"""
content = content.replace(web_author_block, web_follow_button)

# 5. Native Follow Button
native_author_block = """            <Text style={styles.authorName}>
              {currentStory.user_profile?.display_name || 'Snapchat Story'}
            </Text>"""
native_follow_button = """            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.authorName}>
                {currentStory.user_profile?.display_name || 'Snapchat Story'}
              </Text>
              {userRole === 'customer' && !isFollowing && currentStory.user_id && currentStory.user_id !== currentUserId && (
                <Pressable
                  onPress={handleFollow}
                  disabled={isFollowingLoading}
                  style={{
                    backgroundColor: '#FFFC00', paddingHorizontal: 12, paddingVertical: 4,
                    borderRadius: 12, marginLeft: 8
                  }}
                >
                  <Text style={{ color: '#000', fontSize: 12, fontWeight: 'bold' }}>
                    {isFollowingLoading ? '...' : 'Follow'}
                  </Text>
                </Pressable>
              )}
            </View>"""
content = content.replace(native_author_block, native_follow_button)

with open(filepath, 'w') as f:
    f.write(content)

print("StoryViewerModal updated successfully.")
