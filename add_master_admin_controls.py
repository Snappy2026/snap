import re

filepath = "src/components/AdminDashboardModal.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Add activeTab type "media"
content = content.replace(
    'const [activeTab, setActiveTab] = useState<"creators" | "users" | "settings">(',
    'const [activeTab, setActiveTab] = useState<"creators" | "users" | "media" | "settings">('
)

# Add states for allStories and allVip
state_anchor = "const [creatorsList, setCreatorsList] = useState<AdminCreatorItem[]>([]);"
new_states = """const [creatorsList, setCreatorsList] = useState<AdminCreatorItem[]>([]);
  const [allStoriesList, setAllStoriesList] = useState<any[]>([]);
  const [allVipMediaList, setAllVipMediaList] = useState<any[]>([]);"""
content = content.replace(state_anchor, new_states)

# Add fetchMedia & delete functions
fetch_anchor = "fetchAdminData();"
new_admin_funcs = """fetchAdminData();

    const fetchAllMedia = async () => {
      try {
        const { data: stData } = await supabase
          .from("stories")
          .select("*, user_profile:profiles(*)")
          .order("created_at", { ascending: false });
        if (stData) setAllStoriesList(stData);

        const { data: vpData } = await supabase
          .from("vip_content")
          .select("*, creator_profile:profiles(*)")
          .order("created_at", { ascending: false });
        if (vpData) setAllVipMediaList(vpData);
      } catch (err) {
        console.error("[Admin Fetch Media Error]", err);
      }
    };

    fetchAllMedia();"""

content = content.replace(fetch_anchor, new_admin_funcs, 1)

# Add Master Admin Delete Handlers
handlers_anchor = "const handleBanUser = (username: string) => {"
new_handlers = """const handleDeleteUserAccount = async (userId: string, username: string) => {
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) throw error;
      setUsersList(prev => prev.filter(u => u.id !== userId));
      setCreatorsList(prev => prev.filter(c => c.id !== userId));
      const msg = `User account @${username} and all profile data deleted from platform.`;
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(msg);
      } else {
        Alert.alert("User Deleted 🗑️", msg);
      }
    } catch (err: any) {
      console.error("[Delete User Error]", err);
    }
  };

  const handleAdminDeleteStory = async (storyId: string) => {
    try {
      const { error } = await supabase.from("stories").delete().eq("id", storyId);
      if (error) throw error;
      setAllStoriesList(prev => prev.filter(s => s.id !== storyId));
      const msg = "Story video deleted from platform!";
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(msg);
      } else {
        Alert.alert("Story Deleted", msg);
      }
    } catch (err: any) {
      console.error("[Delete Story Error]", err);
    }
  };

  const handleAdminDeleteVipMedia = async (mediaId: string) => {
    try {
      const { error } = await supabase.from("vip_content").delete().eq("id", mediaId);
      if (error) throw error;
      setAllVipMediaList(prev => prev.filter(m => m.id !== mediaId));
      const msg = "Media post deleted from platform!";
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.alert(msg);
      } else {
        Alert.alert("Media Deleted", msg);
      }
    } catch (err: any) {
      console.error("[Delete Media Error]", err);
    }
  };

  const handleBanUser = (username: string) => {"""

content = content.replace(handlers_anchor, new_handlers)

# Add 🗑️ Delete Account button to User Card render
user_card_role_end = "</View>\n                  </View>\n                );\n              }}"
new_user_card = """</View>

                    {/* Master Admin Delete User Button */}
                    <TouchableOpacity
                      style={styles.adminDeleteUserBtn}
                      onPress={() => handleDeleteUserAccount(item.id, item.username)}
                    >
                      <Text style={styles.adminDeleteUserText}>🗑️ Delete Account & Profile</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}"""

content = content.replace(user_card_role_end, new_user_card)

# Add MEDIA TAB button to Navigation Tabs
tab_btn_anchor = """        <TouchableOpacity
          style={[styles.tab, activeTab === "settings" && styles.activeTab]}
          onPress={() => setActiveTab("settings")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "settings" && styles.activeTabText,
            ]}
          >
            ⚙️ PRICES
          </Text>
        </TouchableOpacity>"""

new_tab_btn = """        <TouchableOpacity
          style={[styles.tab, activeTab === "media" && styles.activeTab]}
          onPress={() => setActiveTab("media")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "media" && styles.activeTabText,
            ]}
          >
            🎬 MEDIA ({allStoriesList.length + allVipMediaList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "settings" && styles.activeTab]}
          onPress={() => setActiveTab("settings")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "settings" && styles.activeTabText,
            ]}
          >
            ⚙️ PRICES
          </Text>
        </TouchableOpacity>"""

content = content.replace(tab_btn_anchor, new_tab_btn)

# Add Media Tab Render Block
settings_tab_start = '/* TAB 3: Platform Prices & Commission Settings */'
media_tab_render = """/* TAB 3: Media & Content Moderation */
            activeTab === "media" ? (
              <ScrollView contentContainerStyle={styles.listPadding}>
                <Text style={styles.sectionHeaderTitle}>Stories ({allStoriesList.length})</Text>
                {allStoriesList.length === 0 ? (
                  <Text style={styles.emptyMediaText}>No active stories posted.</Text>
                ) : (
                  allStoriesList.map((story) => (
                    <View key={story.id} style={styles.mediaAdminRow}>
                      <Image source={{ uri: story.media_url }} style={styles.mediaAdminThumb} />
                      <View style={styles.mediaAdminInfo}>
                        <Text style={styles.mediaAdminTitle}>Posted by @{story.user_profile?.username || "creator"}</Text>
                        <Text style={styles.mediaAdminDate}>{new Date(story.created_at).toLocaleString()}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.adminDeleteMediaBtn}
                        onPress={() => handleAdminDeleteStory(story.id)}
                      >
                        <Text style={styles.adminDeleteMediaText}>🗑️ Delete Story</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}

                <Text style={[styles.sectionHeaderTitle, { marginTop: 20 }]}>Gallery & VIP Media ({allVipMediaList.length})</Text>
                {allVipMediaList.length === 0 ? (
                  <Text style={styles.emptyMediaText}>No Gallery or VIP posts published.</Text>
                ) : (
                  allVipMediaList.map((item) => (
                    <View key={item.id} style={styles.mediaAdminRow}>
                      <Image source={{ uri: item.media_url }} style={styles.mediaAdminThumb} />
                      <View style={styles.mediaAdminInfo}>
                        <Text style={styles.mediaAdminTitle}>{item.title || "Media Post"}</Text>
                        <Text style={styles.mediaAdminDate}>By @{item.creator_profile?.username || "creator"} • {item.is_public_gallery ? "Gallery" : "VIP"}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.adminDeleteMediaBtn}
                        onPress={() => handleAdminDeleteVipMedia(item.id)}
                      >
                        <Text style={styles.adminDeleteMediaText}>🗑️ Delete Media</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            ) : (
            """ + settings_tab_start

content = content.replace(settings_tab_start, media_tab_render)

# Add Styles for Master Admin Delete controls
styles_anchor = "  userRowCard: {"
new_admin_styles = """  adminDeleteUserBtn: {
    backgroundColor: "rgba(255, 59, 48, 0.12)",
    borderWidth: 1,
    borderColor: "#FF3B30",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  adminDeleteUserText: {
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "800",
  },
  sectionHeaderTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },
  emptyMediaText: {
    color: "#8E8E93",
    fontSize: 13,
    marginBottom: 10,
  },
  mediaAdminRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 8,
  },
  mediaAdminThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 10,
  },
  mediaAdminInfo: {
    flex: 1,
  },
  mediaAdminTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },
  mediaAdminDate: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 2,
  },
  adminDeleteMediaBtn: {
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderWidth: 1,
    borderColor: "#FF3B30",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  adminDeleteMediaText: {
    color: "#FF3B30",
    fontSize: 11,
    fontWeight: "800",
  },
  userRowCard: {"""

content = content.replace(styles_anchor, new_admin_styles)

with open(filepath, "w") as f:
    f.write(content)

print("AdminDashboardModal.tsx updated with full Master Admin controls for deleting users & media!")
