import re

filepath = 'src/screens/StoriesScreen.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# 1. Remove import CategoryFilterBar
content = re.sub(r'import CategoryFilterBar from "../components/CategoryFilterBar";\n', '', content)

# 2. Remove selectedCategory and uploadCategory states
content = re.sub(r'  const \[selectedCategory, setSelectedCategory\] = useState\("ALL"\);\n', '', content)
content = re.sub(r'  const \[uploadCategory, setUploadCategory\] = useState\("ALL"\);\n', '', content)

# 3. Remove category: uploadCategory, from inserts
content = re.sub(r'\s*category: uploadCategory,', '', content)

# 4. Simplify filteredDiscover
filtered_discover_pattern = r'  const filteredDiscover = displayVipItems\.filter\([\s\S]*?\);\n'
content = re.sub(filtered_discover_pattern, '  const filteredDiscover = displayVipItems;\n', content)

# 5. Remove CategoryFilterBar components
cat_filter_pattern = r'\s*<CategoryFilterBar\s*selectedCategoryId=\{selectedCategory\}\s*onSelectCategory=\{setSelectedCategory\}\s*/>\n'
content = re.sub(cat_filter_pattern, '\n', content)

# 6. Remove Select Category section from Modal
modal_cat_pattern = r'\s*\{\(uploadDestination === "gallery" \|\|[\s\S]*?\}\)\}\n\s*</ScrollView>\n\s*</View>\n\s*\}\)'
content = re.sub(modal_cat_pattern, '', content)

with open(filepath, 'w') as f:
    f.write(content)

print("Categories removed successfully.")
