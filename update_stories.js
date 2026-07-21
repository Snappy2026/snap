const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'screens', 'StoriesScreen.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add state variables for VIP and Role, and new arrays
content = content.replace(
  /const \[showAddStoryModal, setShowAddStoryModal\] = useState\(false\);/,
  `const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [isVipMember, setIsVipMember] = useState(false);
  const [userRole, setUserRole] = useState('customer');
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [vipItems, setVipItems] = useState<any[]>([]);
  const [uploadDestination, setUploadDestination] = useState<'story'|'gallery'|'vip'>('story');
  const [uploadCategory, setUploadCategory] = useState('ALL');`
);

// 2. Fetch VIP status and VIP/Gallery items
content = content.replace(
  /setCurrentUserId\(user\?\.id \|\| null\);/,
  `setCurrentUserId(user?.id || null);

        if (user?.id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role, is_vip_member')
            .eq('id', user.id)
            .single();
          setIsVipMember(profileData?.is_vip_member || false);
          setUserRole(profileData?.role || 'customer');
        }

        const { data: vipData } = await supabase
          .from('vip_content')
          .select('*, creator_profile:profiles(*)');

        if (vipData) {
          setGalleryItems(vipData.filter((v: any) => v.is_public_gallery === true));
          setVipItems(vipData.filter((v: any) => v.is_public_gallery !== true));
        }`
);

// 3. Update handleDeviceFileUpload logic
content = content.replace(
  /const newStoryItem: Story = {[\s\S]*?sessionStore\.addStory\(newStoryItem\);\n\s*setDbStories\(\(prev\) => \[newStoryItem, \.\.\.prev\]\);/,
  `if (uploadDestination === 'story') {
            const newStoryItem: Story = {
              id: \`uploaded-story-\${Date.now()}\`,
              user_id: user?.id || 'demo-user-id',
              media_url: mediaUrl,
              media_type: isVideo ? 'video' : 'image',
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 86400000).toISOString(),
              user_profile: { display_name: userDisplayName },
            };
            sessionStore.addStory(newStoryItem);
            setDbStories((prev) => [newStoryItem, ...prev]);
          } else {
            // Upload to Gallery or VIP
            const newVipItem = {
              id: \`uploaded-\${uploadDestination}-\${Date.now()}\`,
              creator_id: user?.id || 'demo-user-id',
              title: \`My \${uploadDestination} post\`,
              description: '',
              media_url: mediaUrl,
              media_type: isVideo ? 'video' : 'image',
              required_tier: uploadDestination === 'vip' ? 'vip' : 'public',
              category: uploadCategory,
              is_public_gallery: uploadDestination === 'gallery',
              created_at: new Date().toISOString(),
              creator_profile: { display_name: userDisplayName, username: userDisplayName },
            };
            if (uploadDestination === 'gallery') {
              setGalleryItems(prev => [newVipItem, ...prev]);
            } else {
              setVipItems(prev => [newVipItem, ...prev]);
            }
          }`
);

// 4. Update the DB insert in handleDeviceFileUpload
content = content.replace(
  /if \(user\) {\n\s*await \(supabase\.from\('stories'\) as any\)\.insert\({[\s\S]*?}\);\n\s*}/,
  `if (user) {
            if (uploadDestination === 'story') {
              await (supabase.from('stories') as any).insert({
                user_id: user.id,
                media_url: mediaUrl,
                media_type: isVideo ? 'video' : 'image',
              });
            } else {
              await (supabase.from('vip_content') as any).insert({
                creator_id: user.id,
                media_url: mediaUrl,
                media_type: isVideo ? 'video' : 'image',
                title: \`My \${uploadDestination} post\`,
                description: '',
                required_tier: uploadDestination === 'vip' ? 'vip' : 'public',
                category: uploadCategory,
                is_public_gallery: uploadDestination === 'gallery',
              });
            }
          }`
);

// 5. Replace "Subscriptions" with "Gallery" (Web)
content = content.replace(
  /<span style={{ color: '#FFF', fontSize: '17px', fontWeight: 'bold' }}>Subscriptions<\/span>/g,
  `<span style={{ color: '#FFF', fontSize: '17px', fontWeight: 'bold' }}>Gallery</span>`
);

// 6. Replace "Subscriptions" with "Gallery" (Native)
content = content.replace(
  /<Text style={styles.sectionTitle}>Subscriptions<\/Text>/g,
  `<Text style={styles.sectionTitle}>Gallery</Text>`
);

// 7. Update Subscriptions mapping to Gallery mapping (Web)
content = content.replace(
  /\{SUBSCRIPTIONS\.map\(\(sub\) => \([\s\S]*?<\/button>\n\s*\)\)}/,
  `{(galleryItems.length > 0 ? galleryItems : SUBSCRIPTIONS).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  openStoryViewer([{
                    id: sub.id, media_url: sub.media_url || sub.image, media_type: sub.media_type || 'image',
                    user_profile: { display_name: sub.creator_profile?.username || sub.author },
                  }]);
                }}
                style={{
                  border: 'none', background: 'none', padding: 0, margin: 0,
                  cursor: 'pointer', WebkitAppearance: 'none' as any,
                  appearance: 'none' as any, touchAction: 'manipulation',
                  width: '140px', height: '200px', borderRadius: '14px',
                  overflow: 'hidden', backgroundColor: '#1C1C1E', flexShrink: 0,
                  position: 'relative' as any,
                }}
              >
                <Image source={{ uri: sub.media_url || sub.image }} style={styles.subImage} />
                <View style={styles.subGradientOverlay}>
                  <Text style={styles.subAuthor}>@{sub.creator_profile?.username || sub.author}</Text>
                  <Text style={styles.subTitle} numberOfLines={2}>{sub.title}</Text>
                </View>
              </button>
            ))}`
);

// 8. Update Subscriptions mapping to Gallery mapping (Native)
content = content.replace(
  /\{SUBSCRIPTIONS\.map\(\(sub\) => \([\s\S]*?<\/WebTouchable>\n\s*\)\)}/,
  `{(galleryItems.length > 0 ? galleryItems : SUBSCRIPTIONS).map((sub) => (
              <WebTouchable
                key={sub.id}
                style={styles.subCard}
                onPress={() => {
                  openStoryViewer([{
                    id: sub.id, media_url: sub.media_url || sub.image, media_type: sub.media_type || 'image',
                    user_profile: { display_name: sub.creator_profile?.username || sub.author },
                  }]);
                }}
              >
                <Image source={{ uri: sub.media_url || sub.image }} style={styles.subImage} />
                <View style={styles.subGradientOverlay}>
                  <Text style={styles.subAuthor}>@{sub.creator_profile?.username || sub.author}</Text>
                  <Text style={styles.subTitle} numberOfLines={2}>{sub.title}</Text>
                </View>
              </WebTouchable>
            ))}`
);

// 9. Replace "For You" with "VIP Section" (Web)
content = content.replace(
  /<span style={{ color: '#FFF', fontSize: '17px', fontWeight: 'bold' }}>For You<\/span>/,
  `<span style={{ color: '#FFF', fontSize: '17px', fontWeight: 'bold', color: '#FFD700' }}>👑 VIP Section</span>`
);

// 10. Replace "For You" with "VIP Section" (Native)
content = content.replace(
  /<Text style={styles.sectionTitle}>For You<\/Text>/,
  `<Text style={[styles.sectionTitle, { color: '#FFD700' }]}>👑 VIP Section</Text>`
);

// 11. Replace filteredDiscover with vipItems for Discover Grid
content = content.replace(
  /const filteredDiscover = FOR_YOU\.filter\([\s\S]*?\);/,
  `const displayVipItems = vipItems.length > 0 ? vipItems : FOR_YOU;
  const filteredDiscover = displayVipItems.filter(
    (item) => selectedCategory === 'ALL' || (item.category && item.category.toUpperCase() === selectedCategory.toUpperCase())
  );`
);

// 12. Update the Grid rendering (Web) to include blur
content = content.replace(
  /\{filteredDiscover\.map\(\(item\) => \(\s*<button[\s\S]*?<\/button>\n\s*\)\)}/,
  `{filteredDiscover.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (!isVipMember) {
                    window.alert('👑 VIP Membership Required\\n\\nRedirecting to checkout...');
                    // trigger stripe checkout here or open VIP Modal
                    navigation.navigate('MainTabs', { screen: 'VIP' } as any);
                    return;
                  }
                  openStoryViewer([{
                    id: item.id, media_url: item.media_url || item.image, media_type: item.media_type || 'image',
                    user_profile: { display_name: item.creator_profile?.username || item.publisher },
                  }]);
                }}
                style={{
                  border: 'none', background: 'none', padding: 0, margin: 0,
                  cursor: 'pointer', WebkitAppearance: 'none' as any,
                  appearance: 'none' as any, touchAction: 'manipulation',
                  width: \`\${cardWidth}px\`, height: \`\${cardWidth * 1.5}px\`,
                  borderRadius: '14px', overflow: 'hidden',
                  backgroundColor: '#1C1C1E', marginBottom: '12px',
                  position: 'relative' as any,
                }}
              >
                <Image 
                  source={{ uri: item.media_url || item.image }} 
                  style={[styles.discoverImage, !isVipMember && { opacity: 0.4, filter: 'blur(8px)' } as any]} 
                />
                {!isVipMember && (
                  <View style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' as any }}>
                    <Text style={{ fontSize: 30 }}>🔒</Text>
                  </View>
                )}
                <View style={styles.discoverGradientOverlay}>
                  <Text style={styles.categoryBadge}>{item.category || item.category}</Text>
                  <Text style={styles.discoverTitle} numberOfLines={3}>{item.title}</Text>
                  <Text style={styles.publisherName}>@{item.creator_profile?.username || item.publisher}</Text>
                </View>
              </button>
            ))}`
);

// 13. Update Grid rendering (Native) to include blur
content = content.replace(
  /\{filteredDiscover\.map\(\(item\) => \(\s*<WebTouchable[\s\S]*?<\/WebTouchable>\n\s*\)\)}/,
  `{filteredDiscover.map((item) => (
              <WebTouchable
                key={item.id}
                style={styles.discoverCard}
                onPress={() => {
                  if (!isVipMember) {
                    // Trigger native checkout (e.g. RevenueCat or Stripe)
                    navigation.navigate('MainTabs', { screen: 'VIP' });
                    return;
                  }
                  openStoryViewer([{
                    id: item.id, media_url: item.media_url || item.image, media_type: item.media_type || 'image',
                    user_profile: { display_name: item.creator_profile?.username || item.publisher },
                  }]);
                }}
              >
                <Image 
                  source={{ uri: item.media_url || item.image }} 
                  style={[styles.discoverImage, !isVipMember && { opacity: 0.4 }]} 
                  blurRadius={!isVipMember ? 10 : 0}
                />
                {!isVipMember && (
                  <View style={{ position: 'absolute', top: '40%', left: '45%' }}>
                    <Text style={{ fontSize: 30 }}>🔒</Text>
                  </View>
                )}
                <View style={styles.discoverGradientOverlay}>
                  <Text style={styles.categoryBadge}>{item.category}</Text>
                  <Text style={styles.discoverTitle} numberOfLines={3}>{item.title}</Text>
                  <Text style={styles.publisherName}>@{item.creator_profile?.username || item.publisher}</Text>
                </View>
              </WebTouchable>
            ))}`
);

// 14. Update Add Story Modal UI to include Destination & Category Picker
content = content.replace(
  /<View style=\{styles\.addModalHeader\}>[\s\S]*?<\/Modal>/,
  `<View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>👻 Add Content</Text>
              <Pressable onPress={() => setShowAddStoryModal(false)} style={styles.addModalClose}>
                <Text style={styles.addModalCloseText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.addModalSubtitle}>
              Where do you want to post this content?
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
              <Pressable 
                onPress={() => setUploadDestination('story')}
                style={{ padding: 8, borderBottomWidth: uploadDestination === 'story' ? 2 : 0, borderColor: '#00F2FE' }}>
                <Text style={{ color: uploadDestination === 'story' ? '#00F2FE' : '#888', fontWeight: 'bold' }}>Story (24h)</Text>
              </Pressable>
              {userRole === 'creator' && (
                <>
                  <Pressable 
                    onPress={() => setUploadDestination('gallery')}
                    style={{ padding: 8, borderBottomWidth: uploadDestination === 'gallery' ? 2 : 0, borderColor: '#00F2FE' }}>
                    <Text style={{ color: uploadDestination === 'gallery' ? '#00F2FE' : '#888', fontWeight: 'bold' }}>Gallery</Text>
                  </Pressable>
                  <Pressable 
                    onPress={() => setUploadDestination('vip')}
                    style={{ padding: 8, borderBottomWidth: uploadDestination === 'vip' ? 2 : 0, borderColor: '#FFD700' }}>
                    <Text style={{ color: uploadDestination === 'vip' ? '#FFD700' : '#888', fontWeight: 'bold' }}>VIP 🔒</Text>
                  </Pressable>
                </>
              )}
            </View>

            {(uploadDestination === 'gallery' || uploadDestination === 'vip') && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#FFF', marginBottom: 8 }}>Select Category:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {['ALL', 'SCIENCE', 'AUTO', 'GAMING', 'LIFESTYLE', 'TECH', 'FOOD'].map(cat => (
                    <Pressable 
                      key={cat}
                      onPress={() => setUploadCategory(cat)}
                      style={{ 
                        paddingHorizontal: 12, paddingVertical: 6, 
                        backgroundColor: uploadCategory === cat ? '#FFFC00' : '#333',
                        borderRadius: 12, marginRight: 8 
                      }}>
                      <Text style={{ color: uploadCategory === cat ? '#000' : '#FFF', fontWeight: 'bold' }}>{cat}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.addOptionBtnPrimary, pressed && { opacity: 0.8 }]}
              onPress={() => {
                if (Platform.OS === 'web' && fileInputRef.current) {
                  fileInputRef.current.click();
                } else {
                  setShowAddStoryModal(false);
                  navigation.navigate('MainTabs', { screen: 'Camera' });
                }
              }}
            >
              <Text style={styles.addOptionIcon}>📁</Text>
              <View>
                <Text style={styles.addOptionText}>Upload from Device</Text>
                <Text style={styles.addOptionSubtext}>Select any photo or video</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>`
);

fs.writeFileSync(filePath, content);
console.log('StoriesScreen.tsx successfully updated.');
