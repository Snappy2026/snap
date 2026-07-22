import re

filepath = "App.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Add 100vh and absolute positioning to root styles in App.tsx CSS
css_addition = """        html, body, #root {
          height: 100%;
          min-height: 100vh;
          overflow: hidden;
          background-color: #000;
        }
        /* Fix React Native Web touch-action blocking on mobile Safari */"""

content = content.replace("/* Fix React Native Web touch-action blocking on mobile Safari */", css_addition)

with open(filepath, "w") as f:
    f.write(content)

print("App.tsx global CSS updated!")
