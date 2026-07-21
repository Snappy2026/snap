import os

filepath = 'src/screens/StoriesScreen.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# Web replacement
web_search = """            {/* MY STORY */}
            <button
              type="button"
              onClick={() => openMyStory()}
              style={{
                border: "none",
                background: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column" as any,
                alignItems: "center",
                cursor: "pointer",
                WebkitAppearance: "none" as any,
                appearance: "none" as any,
                touchAction: "manipulation",
                minWidth: "80px",
                flexShrink: 0,
              }}
            >
              <View
                style={[
                  styles.avatarRing,
                  myStories.length > 0
                    ? styles.activeMyStoryRing
                    : styles.addStoryRing,
                ]}
              >
                <Image
                  source={{
                    uri:
                      myStories.length > 0
                        ? myStories[0].media_url
                        : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                  }}
                  style={styles.friendAvatar}
                />
                {myStories.length === 0 && (
                  <View style={styles.plusBadge}>
                    <Text style={styles.plusBadgeText}>＋</Text>
                  </View>
                )}
              </View>
              <Text style={styles.myStoryName} numberOfLines={1}>
                {myStories.length > 0
                  ? \`My Story (\${myStories.length})\`
                  : "Add Story"}
              </Text>
            </button>"""

web_replace = """            {/* ADD STORY BUTTON */}
            <button
              type="button"
              onClick={() => setShowAddStoryModal(true)}
              style={{
                border: "none",
                background: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column" as any,
                alignItems: "center",
                cursor: "pointer",
                WebkitAppearance: "none" as any,
                appearance: "none" as any,
                touchAction: "manipulation",
                minWidth: "80px",
                flexShrink: 0,
              }}
            >
              <View style={[styles.avatarRing, styles.addStoryRing]}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" }}
                  style={styles.friendAvatar}
                />
                <View style={styles.plusBadge}>
                  <Text style={styles.plusBadgeText}>＋</Text>
                </View>
              </View>
              <Text style={styles.myStoryName} numberOfLines={1}>Add Story</Text>
            </button>

            {/* MY STORY (IF EXISTS) */}
            {myStories.length > 0 && (
              <button
                type="button"
                onClick={() => openMyStory()}
                style={{
                  border: "none",
                  background: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column" as any,
                  alignItems: "center",
                  cursor: "pointer",
                  WebkitAppearance: "none" as any,
                  appearance: "none" as any,
                  touchAction: "manipulation",
                  minWidth: "80px",
                  flexShrink: 0,
                }}
              >
                <View style={[styles.avatarRing, styles.activeMyStoryRing]}>
                  <Image
                    source={{ uri: myStories[0].media_url }}
                    style={styles.friendAvatar}
                  />
                </View>
                <Text style={styles.myStoryName} numberOfLines={1}>
                  \`My Story (\${myStories.length})\`
                </Text>
              </button>
            )}"""

content = content.replace(web_search, web_replace)


# Native replacement
native_search = """            {/* 1. "My Story" (Add Story) Button */}
            <WebTouchable style={styles.friendItem} onPress={openMyStory}>
              <View
                style={[
                  styles.avatarRing,
                  myStories.length > 0
                    ? styles.activeMyStoryRing
                    : styles.addStoryRing,
                ]}
              >
                <Image
                  source={{
                    uri:
                      myStories.length > 0
                        ? myStories[0].media_url
                        : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                  }}
                  style={styles.friendAvatar}
                />
                {myStories.length === 0 && (
                  <View style={styles.plusBadge}>
                    <Text style={styles.plusBadgeText}>＋</Text>
                  </View>
                )}
              </View>
              <Text style={styles.friendName} numberOfLines={1}>
                {myStories.length > 0 ? "My Story" : "Add Story"}
              </Text>
            </WebTouchable>"""

native_replace = """            {/* ADD STORY BUTTON */}
            <WebTouchable style={styles.friendItem} onPress={() => setShowAddStoryModal(true)}>
              <View style={[styles.avatarRing, styles.addStoryRing]}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" }}
                  style={styles.friendAvatar}
                />
                <View style={styles.plusBadge}>
                  <Text style={styles.plusBadgeText}>＋</Text>
                </View>
              </View>
              <Text style={styles.friendName} numberOfLines={1}>Add Story</Text>
            </WebTouchable>

            {/* MY STORY (IF EXISTS) */}
            {myStories.length > 0 && (
              <WebTouchable style={styles.friendItem} onPress={openMyStory}>
                <View style={[styles.avatarRing, styles.activeMyStoryRing]}>
                  <Image
                    source={{ uri: myStories[0].media_url }}
                    style={styles.friendAvatar}
                  />
                </View>
                <Text style={styles.friendName} numberOfLines={1}>My Story</Text>
              </WebTouchable>
            )}"""

content = content.replace(native_search, native_replace)

with open(filepath, 'w') as f:
    f.write(content)

print("Bubbles split successfully")
