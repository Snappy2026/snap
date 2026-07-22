import re
import os

# Files to update border colors
files_to_update = [
    "src/screens/AuthScreen.tsx",
    "src/navigation/AppNavigator.tsx",
    "src/components/SnapBar.tsx",
    "src/components/CreatorOnboardingModal.tsx",
    "src/components/CreatorContentStudioModal.tsx",
    "src/components/CreatorSettingsModal.tsx",
    "src/components/AdminDashboardModal.tsx",
    "src/screens/VipMembersScreen.tsx",
    "src/screens/StoriesScreen.tsx",
]

for filepath in files_to_update:
    if not os.path.exists(filepath):
        continue
    with open(filepath, "r") as f:
        content = f.read()

    # Replace gold border colors with thin light grey-white rgba(255, 255, 255, 0.18)
    content = content.replace('borderColor: "rgba(212, 175, 55, 0.35)"', 'borderColor: "rgba(255, 255, 255, 0.18)"')
    content = content.replace('borderColor: "rgba(212, 175, 55, 0.2)"', 'borderColor: "rgba(255, 255, 255, 0.15)"')
    content = content.replace('borderColor: "rgba(212, 175, 55, 0.15)"', 'borderColor: "rgba(255, 255, 255, 0.12)"')
    content = content.replace('borderColor: "rgba(212, 175, 55, 0.3)"', 'borderColor: "rgba(255, 255, 255, 0.18)"')
    content = content.replace('borderTopColor: "rgba(212, 175, 55, 0.3)"', 'borderTopColor: "rgba(255, 255, 255, 0.12)"')

    # Fix AuthScreen buttons specifically
    if "AuthScreen.tsx" in filepath:
        old_submit = """  submitBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D4AF37",
    height: 50,
    borderRadius: 14,
    justify.content: "center",
    alignItems: "center",
    marginTop: 10,
  },"""
        # Replace submitBtn & adminLoginBtn border colors with light grey white
        content = re.sub(
            r'submitBtn:\s*\{\s*backgroundColor:\s*"transparent",\s*borderWidth:\s*1,\s*borderColor:\s*"#D4AF37",',
            'submitBtn: {\n    backgroundColor: "transparent",\n    borderWidth: 1,\n    borderColor: "rgba(255, 255, 255, 0.22)",',
            content
        )
        content = re.sub(
            r'adminLoginBtn:\s*\{\s*backgroundColor:\s*"transparent",\s*height:\s*46,\s*borderRadius:\s*14,\s*justifyContent:\s*"center",\s*alignItems:\s*"center",\s*marginTop:\s*14,\s*borderWidth:\s*1,\s*borderColor:\s*"#D4AF37",',
            'adminLoginBtn: {\n    backgroundColor: "transparent",\n    height: 46,\n    borderRadius: 14,\n    justifyContent: "center",\n    alignItems: "center",\n    marginTop: 14,\n    borderWidth: 1,\n    borderColor: "rgba(255, 255, 255, 0.22)",',
            content
        )

    with open(filepath, "w") as f:
        f.write(content)

print("Border colors across screens updated to thin light grey-white!")
