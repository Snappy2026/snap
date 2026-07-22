import re

filepath = "src/components/SnapBar.tsx"
with open(filepath, "r") as f:
    content = f.read()

old_center = """        {/* Center: Clean Adult+ Title */}
        <View style={styles.centerBrandContainer}>
          <Text style={styles.brandTitleText}>{title || "Adult+"}</Text>
        </View>"""

new_center = """        {/* Center: Clean Logo Header */}
        <View style={styles.centerBrandContainer}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.headerLogoImage}
            resizeMode="contain"
          />
        </View>"""

content = content.replace(old_center, new_center)

old_style = "  brandTitleText: {"
new_style = """  headerLogoImage: {
    width: 140,
    height: 38,
  },
  brandTitleText: {"""

content = content.replace(old_style, new_style)

with open(filepath, "w") as f:
    f.write(content)

print("SnapBar.tsx center logo updated to transparent logo image!")
