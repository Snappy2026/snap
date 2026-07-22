import re

filepath = "src/components/SnapBar.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Replace searchBox with clean center title / logo text
old_search_block = """        {/* Center: Responsive Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search"
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            style={styles.searchInput}
            onChangeText={onSearchChange}
          />
        </View>"""

new_center_block = """        {/* Center: Clean Adult+ Title */}
        <View style={styles.centerBrandContainer}>
          <Text style={styles.brandTitleText}>{title || "Adult+"}</Text>
        </View>"""

content = content.replace(old_search_block, new_center_block)

# Add Creator Studio button alongside Payouts button for Creator role
old_creator_actions = """          {userRole === "creator" && (
            <TouchableOpacity
              style={styles.stripeBarBtn}
              onPress={() => setShowSettingsModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.stripeBarText}>💳 Payouts</Text>
            </TouchableOpacity>
          )}"""

new_creator_actions = """          {userRole === "creator" && (
            <>
              <TouchableOpacity
                style={styles.studioBarBtn}
                onPress={() => setShowStudioModal && setShowStudioModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.studioBarText}>🎨 Studio</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stripeBarBtn}
                onPress={() => setShowSettingsModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.stripeBarText}>💳 Payouts</Text>
              </TouchableOpacity>
            </>
          )}"""

content = content.replace(old_creator_actions, new_creator_actions)

# Update styles for centerBrandContainer and brandTitleText
old_styles_anchor = "  profileButton: {"
new_styles = """  centerBrandContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitleText: {
    color: "#D4AF37",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  studioBarBtn: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D4AF37",
    marginRight: 6,
  },
  studioBarText: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "800",
  },
  profileButton: {"""

content = content.replace(old_styles_anchor, new_styles)

with open(filepath, "w") as f:
    f.write(content)

print("SnapBar.tsx search bar removed and studio button added!")
