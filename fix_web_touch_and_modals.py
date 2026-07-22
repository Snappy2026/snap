import re

# 1. Update SnapBar.tsx to ensure Modals display reliably on mobile web
filepath = "src/components/SnapBar.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Replace AdminDashboardModal wrapper with direct web-compatible overlay
old_admin_modal_jsx = """      {/* Master Admin Console Modal */}
      <Modal
        visible={showAdminModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdminModal(false)}
      >
        <AdminDashboardModal onClose={() => setShowAdminModal(false)} />
      </Modal>"""

new_admin_modal_jsx = """      {/* Master Admin Console Modal */}
      {showAdminModal && (
        <Modal
          visible={showAdminModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowAdminModal(false)}
        >
          <View style={styles.webFullModalOverlay}>
            <AdminDashboardModal onClose={() => setShowAdminModal(false)} />
          </View>
        </Modal>
      )}"""

content = content.replace(old_admin_modal_jsx, new_admin_modal_jsx)

# Add webFullModalOverlay style definition
old_styles = "  modalOverlay: {"
new_styles = """  webFullModalOverlay: {
    flex: 1,
    backgroundColor: "#000000",
    ...(Platform.OS === "web" ? { position: "fixed" as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999 } : {}),
  },
  modalOverlay: {"""

content = content.replace(old_styles, new_styles)

with open(filepath, "w") as f:
    f.write(content)

print("SnapBar.tsx modal overlays updated!")

# 2. Update AdminDashboardModal.tsx root style to occupy full height
admin_path = "src/components/AdminDashboardModal.tsx"
with open(admin_path, "r") as f:
    admin_code = f.read()

old_admin_container = "  container: {\n    flex: 1,\n    backgroundColor: \"#000\","
new_admin_container = """  container: {
    flex: 1,
    backgroundColor: "#000000",
    ...(Platform.OS === "web" ? { minHeight: "100vh" as any, width: "100%" } : {}),"""

admin_code = admin_code.replace(old_admin_container, new_admin_container)

with open(admin_path, "w") as f:
    f.write(admin_code)

print("AdminDashboardModal.tsx root styles updated for mobile web!")

# 3. Update AuthScreen.tsx touch response
auth_path = "src/screens/AuthScreen.tsx"
with open(auth_path, "r") as f:
    auth_code = f.read()

old_submit_btn = "  submitBtn: {\n    backgroundColor: \"transparent\","
new_submit_btn = """  submitBtn: {
    backgroundColor: "transparent",
    ...(Platform.OS === "web" ? { cursor: "pointer" as any, touchAction: "manipulation" as any } : {}),"""

auth_code = auth_code.replace(old_submit_btn, new_submit_btn)

with open(auth_path, "w") as f:
    f.write(auth_code)

print("AuthScreen.tsx submitBtn touch styles updated!")
