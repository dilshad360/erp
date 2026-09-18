import os
from PIL import Image

def generate_icons():
    logo_path = os.path.join("public", "logo.png")
    if not os.path.exists(logo_path):
        print(f"Error: {logo_path} not found")
        return

    img = Image.open(logo_path).convert("RGBA")
    
    # 1. 512x512 PWA Icon
    icon_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save(os.path.join("public", "icons", "icon-512.png"), "PNG")
    print("Created public/icons/icon-512.png")

    # 2. 192x192 PWA Icon
    icon_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
    icon_192.save(os.path.join("public", "icons", "icon-192.png"), "PNG")
    print("Created public/icons/icon-192.png")

    # 3. 180x180 Apple Touch Icon
    icon_apple = img.resize((180, 180), Image.Resampling.LANCZOS)
    icon_apple.save(os.path.join("public", "icons", "apple-touch-icon.png"), "PNG")
    print("Created public/icons/apple-touch-icon.png")

    # 4. 512x512 Maskable Icon (with 10% safe margin background)
    maskable = Image.new("RGBA", (512, 512), (15, 17, 23, 255)) # Dark background #0f1117
    scaled_logo = img.resize((410, 410), Image.Resampling.LANCZOS)
    maskable.paste(scaled_logo, (51, 51), scaled_logo)
    maskable.save(os.path.join("public", "icons", "icon-maskable-512.png"), "PNG")
    print("Created public/icons/icon-maskable-512.png")

    # 5. Favicon .ico (16, 32, 48, 64)
    img.save(os.path.join("public", "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("Created public/favicon.ico")

    # 6. Next.js App Router root app icon
    img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join("app", "icon.png"), "PNG")
    img.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join("app", "apple-icon.png"), "PNG")
    print("Created app/icon.png and app/apple-icon.png")

if __name__ == "__main__":
    generate_icons()
