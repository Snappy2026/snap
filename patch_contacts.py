import re

filepath = "src/components/ContactInviteModal.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Empty the DEMO_CONTACTS array
content = re.sub(r'const DEMO_CONTACTS: PhoneContact\[\] = \[.*?\];', 'const DEMO_CONTACTS: PhoneContact[] = [];', content, flags=re.DOTALL)

with open(filepath, "w") as f:
    f.write(content)

print("ContactInviteModal.tsx updated!")
