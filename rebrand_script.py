import os
import re

TARGET_DIRS = ["src", "supabase"]
ROOT_FILES = ["app.json", "package.json"]

OLD_COLOR = "#FFFC00"
NEW_COLOR = "#D4AF37"

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content

    # Color Replace
    content = content.replace(OLD_COLOR, NEW_COLOR)
    # Also replace lowercase just in case
    content = content.replace("#fffc00", NEW_COLOR)

    # Name Rebranding
    content = content.replace("Snapchat", "Adult+")
    content = content.replace("snapchat", "adultplus")
    
    # Specific edge cases
    content = content.replace("Snapchat Starter", "Adult+ Starter")
    
    # Remove Debug UI from StoriesScreen
    if "StoriesScreen.tsx" in filepath:
        # Regex to remove the entire debug UI block
        debug_pattern = re.compile(r'\{\/\*\s*DEBUG TOGGLE UI FOR TESTING\s*\*\/\}.*?\}\)\s*\}\s*<\/div>\s*\)\}\s*', re.DOTALL)
        content = debug_pattern.sub('', content)

    if original != content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root_file in ROOT_FILES:
    if os.path.exists(root_file):
        process_file(root_file)

for target_dir in TARGET_DIRS:
    for root, dirs, files in os.walk(target_dir):
        for file in files:
            if file.endswith((".tsx", ".ts", ".json")):
                process_file(os.path.join(root, file))

print("Rebrand script complete!")
