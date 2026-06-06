import fitz

pdf_path = r"c:\Users\sergi\.gemini\antigravity\scratch\CursosIEDCH\public\CONSTACIA 1.pdf"
output_img_path = r"c:\Users\sergi\.gemini\antigravity\scratch\CursosIEDCH\public\constancia_background_clean.png"

print("Opening PDF...")
doc = fitz.open(pdf_path)
page = doc[0]

print("Finding all text blocks to redact...")
# Iterate over all text spans/blocks and redact them to get a clean background
for block in page.get_text("blocks"):
    rect = block[:4]
    # Add redaction annotation over the text bounding box
    page.add_redact_annot(rect, fill=(1, 1, 1)) # fill with white color

print("Applying redactions...")
page.apply_redactions()

print("Rendering page to PNG...")
pix = page.get_pixmap(dpi=150)
pix.save(output_img_path)
print(f"Clean background template saved successfully to: {output_img_path}")

doc.close()
