import re

filepath = "src/components/SnapBar.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Add import CreatorContentStudioModal
if "CreatorContentStudioModal" not in content:
    content = content.replace(
        'import CustomerSettingsModal from "./CustomerSettingsModal";',
        'import CustomerSettingsModal from "./CustomerSettingsModal";\nimport CreatorContentStudioModal from "./CreatorContentStudioModal";'
    )

# Add showStudioModal state
state_target = 'const [showCustomerModal, setShowCustomerModal] = useState(false);'
new_state = 'const [showCustomerModal, setShowCustomerModal] = useState(false);\n  const [showStudioModal, setShowStudioModal] = useState(false);'
content = content.replace(state_target, new_state)

# Replace setShowStudioModal in button handler
content = content.replace('setShowStudioModal && setShowStudioModal(true)', 'setShowStudioModal(true)')

# Add Modal component at bottom of JSX
jsx_target = '{showCustomerModal && ('
new_modal_jsx = """{showStudioModal && (
        <CreatorContentStudioModal
          visible={showStudioModal}
          onClose={() => setShowStudioModal(false)}
        />
      )}

      {showCustomerModal && ("""
content = content.replace(jsx_target, new_modal_jsx)

with open(filepath, "w") as f:
    f.write(content)

print("SnapBar.tsx updated with CreatorContentStudioModal!")
