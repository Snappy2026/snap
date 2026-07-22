import json

# 1. Update app.json
app_json_path = "app.json"
with open(app_json_path, "r") as f:
    data = json.load(f)

data["expo"]["name"] = "ClubD"
data["expo"]["slug"] = "clubd"
data["expo"]["web"] = {
    "favicon": "./assets/favicon.png",
    "name": "ClubD",
    "shortName": "ClubD",
    "themeColor": "#000000",
    "backgroundColor": "#000000"
}

with open(app_json_path, "w") as f:
    json.dump(data, f, indent=2)

# 2. Update App.tsx DOM meta tags
app_tsx_path = "App.tsx"
with open(app_tsx_path, "r") as f:
    app_code = f.read()

meta_injection = """    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = "ClubD";
      
      const setMeta = (name, content) => {
        let el = document.querySelector(`meta[name="${name}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute('name', name);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      setMeta("apple-mobile-web-app-title", "ClubD");
      setMeta("application-name", "ClubD");
      setMeta("apple-mobile-web-app-capable", "yes");
      setMeta("apple-mobile-web-app-status-bar-style", "black-translucent");

      let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
      if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.setAttribute('rel', 'apple-touch-icon');
        document.head.appendChild(appleIcon);
      }
      appleIcon.setAttribute('href', '/assets/icon.png');"""

if 'document.title = "ClubD"' not in app_code:
    app_code = app_code.replace(
        "if (Platform.OS === 'web' && typeof document !== 'undefined') {",
        meta_injection
    )
    with open(app_tsx_path, "w") as f:
        f.write(app_code)

print("app.json and App.tsx updated with ClubD branding and home screen icons!")
