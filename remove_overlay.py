import re

filepath = 'src/screens/StoriesScreen.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# Regular expression to match the discoverGradientOverlay and its contents up to the closing View
# We use re.DOTALL to match across newlines
pattern = r'<View style=\{styles\.discoverGradientOverlay\}>.*?</View>'

content = re.sub(pattern, '', content, flags=re.DOTALL)

with open(filepath, 'w') as f:
    f.write(content)

print("discoverGradientOverlay removed")
