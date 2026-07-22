import urllib.request
import re

url = "https://clubdior.com/assets/index-ei0anb1R.js"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        content = response.read().decode('utf-8', errors='ignore')
        images = re.findall(r'\/assets\/[a-zA-Z0-9_\-\.]+\.(?:png|svg|webp|jpg)', content)
        print("Found images in JS bundle:", set(images))
        logos = [img for img in set(images) if 'logo' in img.lower()]
        print("Logo images:", logos)
except Exception as e:
    print("Error:", e)
