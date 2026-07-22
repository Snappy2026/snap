import re

filepath = "src/screens/AuthScreen.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Update submitBtn style
old_submit_btn = """  submitBtn: {
    backgroundColor: "#D4AF37",
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },"""

new_submit_btn = """  submitBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D4AF37",
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  submitBtnText: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },"""

content = content.replace(old_submit_btn, new_submit_btn)

# 2. Update adminLoginBtn style
old_admin_btn = """  adminLoginBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  adminLoginBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },"""

new_admin_btn = """  adminLoginBtn: {
    backgroundColor: "transparent",
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  adminLoginBtnText: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "700",
  },"""

content = content.replace(old_admin_btn, new_admin_btn)

# 3. Ensure KeyboardAvoidingView doesn't scroll into oblivion
# Let's check how the KeyboardAvoidingView is set up
# We can change KeyboardAvoidingView behavior or add a ScrollView inside it if needed, or just let it center.
old_content_style = """  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },"""
new_content_style = """  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },"""
content = content.replace(old_content_style, new_content_style)

with open(filepath, "w") as f:
    f.write(content)

print("AuthScreen.tsx styles updated!")
