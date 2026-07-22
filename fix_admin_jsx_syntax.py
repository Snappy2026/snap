import re

filepath = "src/components/AdminDashboardModal.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Replace line 562 )} with ))
content = content.replace("            </ScrollView>\n          )}", "            </ScrollView>\n          ))")

with open(filepath, "w") as f:
    f.write(content)

print("AdminDashboardModal.tsx JSX closing parens fixed!")
