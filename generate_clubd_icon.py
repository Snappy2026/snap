import os
from PIL import Image, ImageDraw, ImageFont

# Path to dark marble background image & logo
marble_path = "src/assets/marble_bg.png"
logo_path = "src/assets/logo.png"

# Target output files
icon_output = "assets/icon.png"
adaptive_output = "assets/adaptive-icon.png"
favicon_output = "assets/favicon.png"

# Ensure assets dir exists
os.makedirs("assets", exist_ok=True)

# 1. Open or create marble background (512x512)
if os.path.exists(marble_path):
    base_img = Image.open(marble_path).convert("RGBA")
    base_img = base_img.resize((512, 512), Image.Resampling.LANCZOS)
else:
    base_img = Image.new("RGBA", (512, 512), (10, 10, 12, 255))

# 2. Overlay Logo or Render "ClubD"
if os.path.exists(logo_path):
    logo_img = Image.open(logo_path).convert("RGBA")
    # Resize logo to fit inside 512x512
    logo_ratio = logo_img.width / logo_img.height
    new_w = 420
    new_h = int(new_w / logo_ratio)
    logo_resized = logo_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Position centered
    pos_x = (512 - new_w) // 2
    pos_y = (512 - new_h) // 2
    base_img.paste(logo_resized, (pos_x, pos_y), logo_resized)

# Save icon.png, adaptive-icon.png, favicon.png
base_img.save(icon_output, "PNG")
base_img.save(adaptive_output, "PNG")
base_img.save(favicon_output, "PNG")

print(f"Successfully generated ClubD icons with marble background: {icon_output}, {adaptive_output}, {favicon_output}")
