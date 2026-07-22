import urllib.request
import os

url = "https://clubdior.com/assets/clubdior-logo-CV0gBEKJ.png"
target = "src/assets/logo.png"

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response, open(target, 'wb') as out_file:
        data = response.read()
        out_file.write(data)
        print(f"Successfully downloaded {len(data)} bytes to {target}")
except Exception as e:
    print("Download error:", e)
