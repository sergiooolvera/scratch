import sys
import fitz

# Reconfigure stdout to use utf-8
sys.stdout.reconfigure(encoding='utf-8')

doc = fitz.open(r"c:\Users\sergi\.gemini\antigravity\scratch\CursosIEDCH\public\CONSTACIA 1.pdf")
page = doc.load_page(0)

print("--- TEXT BLOCKS ---")
for b in page.get_text("blocks"):
    text_content = b[4].strip().replace("\n", " ")
    print(f"Rect: {b[:4]}, Text: {text_content}")

print("\n--- IMAGES ON PAGE ---")
image_list = page.get_images(full=True)
print(f"Total images: {len(image_list)}")
for img in image_list:
    xref = img[0]
    base_image = doc.extract_image(xref)
    image_bytes = base_image["image"]
    image_ext = base_image["ext"]
    print(f"Xref: {xref}, Ext: {image_ext}, Size: {len(image_bytes)} bytes")

print("\n--- DRAWINGS / VECTOR SHAPES ---")
drawings = page.get_drawings()
print(f"Total drawings: {len(drawings)}")
for i, draw in enumerate(drawings[:10]):
    print(f"Shape {i}: type={draw['type']}, rect={draw['rect']}")
