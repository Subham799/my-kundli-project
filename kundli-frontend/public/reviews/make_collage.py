from PIL import Image
import os
import math

def create_masonry_collage():
    # 🎯 Aapka input folder
    input_folder = r'C:\Users\Subha\Downloads\kundli_final_v10\kundli-frontend\public\reviews'
    
    # 🎯 Kahan save karna hai
    output_image_path = r'C:\Users\Subha\Downloads\website_style_reviews.jpg'
    
    images = []
    
    # 1 se 8 tak images load karna
    for i in range(1, 9):
        img_path = os.path.join(input_folder, f'{i}.png')
        if os.path.exists(img_path):
            images.append(Image.open(img_path).convert('RGB'))
        else:
            print(f"⚠️ Missing: {img_path}")

    if not images:
        print("❌ Koi image nahi mili!")
        return

    # --- SETTINGS (React code se match ki hui) ---
    num_cols = 3
    gap = 24             # React ke 'gap-4' ke hisaab se px
    col_width = 400      # Har column ki width
    bg_color = (15, 23, 42) # React ka bg-[#0f172a] RGB format mein
    # --------------------------------------------

    # 1. Saari images ko column ki width ke hisaab se proportionally resize karna
    resized_images = []
    for img in images:
        # Aspect ratio maintain rakhne ka formula
        width_percent = (col_width / float(img.size[0]))
        new_height = int((float(img.size[1]) * float(width_percent)))
        # High quality resizing (LANCZOS)
        resized_img = img.resize((col_width, new_height), Image.Resampling.LANCZOS)
        resized_images.append(resized_img)

    # 2. Images ko 3 columns mein batna (Jaise CSS columns-3 karta hai)
    # Total 8 images: Col 1 me 3, Col 2 me 3, Col 3 me 2
    items_per_col = math.ceil(len(resized_images) / num_cols)
    columns = [[], [], []]
    
    for i, img in enumerate(resized_images):
        # Determine current column index
        col_idx = min(i // items_per_col, num_cols - 1)
        columns[col_idx].append(img)

    # 3. Har column ki total height calculate karna canvas banane ke liye
    col_heights = []
    for col in columns:
        h = gap # Top margin
        for img in col:
            h += img.size[1] + gap
        col_heights.append(h)

    # Badi image ka final size kya hoga
    max_height = max(col_heights)
    total_width = (col_width * num_cols) + (gap * (num_cols + 1))

    # 4. Canvas banana (Website wale background color ke sath)
    collage = Image.new('RGB', (total_width, max_height), bg_color)

    print("🖼️ Website jaisa Masonry Collage ban raha hai...")

    # 5. Ek ek karke saari images ko unke sahi column me paste karna
    for col_idx, col in enumerate(columns):
        # X coordinate (Left se kitna door)
        x_offset = gap + (col_idx * (col_width + gap))
        # Y coordinate (Upar se kitna door)
        y_offset = gap
        
        for img in col:
            collage.paste(img, (x_offset, y_offset))
            y_offset += img.size[1] + gap # Agli image ke liye niche khisakna

    # Final Save
    collage.save(output_image_path, quality=100)
    print(f"\n🎃 DONE! Ekdum website jaisi perfect alignment ke sath image save ho gayi hai:\n➡️ {output_image_path}")

if __name__ == "__main__":
    create_masonry_collage()