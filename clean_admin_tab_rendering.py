import re

filepath = "src/components/AdminDashboardModal.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Replace ternary chain with clean boolean conditional rendering
old_tab_body = """        <View style={{ flex: 1 }}>
          {activeTab === "creators" ? ("""

# Replace old nested conditionals
content = content.replace(
    '        <View style={{ flex: 1 }}>\n          {activeTab === "creators" ? (',
    '        <View style={{ flex: 1 }}>\n          {activeTab === "creators" && ('
)

content = content.replace(
    '            />\n          ) : activeTab === "users" ? (',
    '            />\n          )}\n\n          {activeTab === "users" && ('
)

content = content.replace(
    '            />\n          ) : (\n            /* TAB 3: Media & Content Moderation */\n            activeTab === "media" ? (',
    '            />\n          )}\n\n          {activeTab === "media" && ('
)

content = content.replace(
    '              </ScrollView>\n            ) : (\n            /* TAB 3: Platform Prices & Commission Settings */',
    '              </ScrollView>\n          )}\n\n          {activeTab === "settings" && ('
)

content = content.replace(
    '              </View>\n            </ScrollView>\n          ))',
    '              </View>\n            </ScrollView>\n          )}'
)

with open(filepath, "w") as f:
    f.write(content)

print("AdminDashboardModal.tsx tab rendering refactored to clean boolean expressions!")
