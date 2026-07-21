const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'screens', 'StoriesScreen.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add import
if (!content.includes("import * as ImagePicker from 'expo-image-picker'")) {
  content = content.replace(
    /import \{ supabase \} from "\.\.\/lib\/supabase";/,
    `import { supabase } from "../lib/supabase";\nimport * as ImagePicker from 'expo-image-picker';`
  );
}

// 2. Add handleCameraCapture function right above handleDeviceFileUpload
const cameraFn = `
  const handleCameraCapture = async () => {
    if (Platform.OS === 'web') {
      window.alert('Camera capture is only supported on native apps. Please use Upload from Device on web.');
      return;
    }
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      window.alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setShowAddStoryModal(false);
      const asset = result.assets[0];
      // Reuse handleDeviceFileUpload logic but skip file input
      const mediaUrl = asset.uri;
      const isVideo = asset.type === 'video';
      const userDisplayName = "Me";
      
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;

        if (uploadDestination === 'story') {
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
        }
      } catch (err) {
        console.error("Camera upload failed", err);
      }
    }
  };
`;

if (!content.includes('handleCameraCapture')) {
  content = content.replace(
    /const handleDeviceFileUpload = \(event: any\) => \{/,
    `${cameraFn}\n  const handleDeviceFileUpload = (event: any) => {`
  );
}

// 3. Add Snap from Camera button
const cameraBtn = `
            <Pressable
              style={({ pressed }) => [styles.addOptionBtnPrimary, pressed && { opacity: 0.8 }, { marginBottom: 12, backgroundColor: '#FFD700' }]}
              onPress={handleCameraCapture}
            >
              <Text style={styles.addOptionIcon}>📷</Text>
              <View>
                <Text style={[styles.addOptionText, { color: '#000' }]}>Snap from Camera</Text>
                <Text style={[styles.addOptionSubtext, { color: '#333' }]}>Take a new photo or video</Text>
              </View>
            </Pressable>
`;

if (!content.includes('Snap from Camera')) {
  content = content.replace(
    /(<Pressable[\s\S]*?styles\.addOptionBtnPrimary[\s\S]*?>[\s\S]*?📁[\s\S]*?<\/Pressable>)/,
    `${cameraBtn}\n            $1`
  );
}

fs.writeFileSync(filePath, content);
console.log('Camera integration applied');
