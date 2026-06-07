import fitz

doc = fitz.open(r"c:\Users\sergi\.gemini\antigravity\scratch\CursosIEDCH\public\CONSTACIA 1.pdf")
xref = 54
base_image = doc.extract_image(xref)
image_bytes = base_image["image"]
image_ext = base_image["ext"]

output_path = rf"c:\Users\sergi\.gemini\antigravity\scratch\CursosIEDCH\public\extracted_xref_54.{image_ext}"
with open(output_path, "wb") as f:
    f.write(image_bytes)

print(f"Extracted image saved to {output_path}")
