import re

# 1. Update App.tsx global CSS
app_filepath = "App.tsx"
with open(app_filepath, "r") as f:
    app_code = f.read()

css_patch = """        html, body, #root {
          height: 100%;
          min-height: 100vh;
          min-height: -webkit-fill-available;
          overflow: hidden;
          background-color: #000;
        }
        /* Lock root container to viewport on mobile web */
        #root > div {
          height: 100vh !important;
          height: -webkit-fill-available !important;
        }
        /* Fix React Native Web touch-action blocking on mobile Safari */"""

if "#root > div" not in app_code:
    app_code = app_code.replace("/* Fix React Native Web touch-action blocking on mobile Safari */", css_patch)
    with open(app_filepath, "w") as f:
        f.write(app_code)

# 2. Update AppNavigator.tsx CustomTabBar styles
nav_filepath = "src/navigation/AppNavigator.tsx"
with open(nav_filepath, "r") as f:
    nav_code = f.read()

# Replace tabBarContainer style definition
old_tab_style = """  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: "#000000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#1A1A1A",
    paddingBottom: 10,
    zIndex: 100,
  },"""

new_tab_style = """  tabBarContainer: {
    position: Platform.OS === "web" ? ("fixed" as any) : "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "web" ? 76 : 70,
    backgroundColor: "#0A0A0C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 175, 55, 0.3)",
    paddingBottom: Platform.OS === "web" ? 14 : 10,
    zIndex: 9999,
  },"""

nav_code = nav_code.replace(old_tab_style, new_tab_style)

# Add Platform import if missing or update CustomTabBar
if "Platform" not in nav_code:
  nav_code = nav_code.replace(
      'ImageBackground,\n} from "react-native";',
      'ImageBackground,\n  Platform,\n} from "react-native";'
  )

with open(nav_filepath, "w") as f:
    f.write(nav_code)

print("Mobile viewport & fixed bottom tab bar styles updated!")
