import os
import fitz # PyMuPDF

pdf_dir = r"c:\Users\sergi\.gemini\antigravity\scratch\CursosIEDCH\public"
files = [("CONSTACIA 1.pdf", "constancia1_proposal.png"), ("CONSTANCIA 2.pdf", "constancia2_proposal.png")]

for pdf_name, img_name in files:
    pdf_path = os.path.join(pdf_dir, pdf_name)
    img_path = os.path.join(pdf_dir, img_name)
    if os.path.exists(pdf_path):
        print(f"Converting {pdf_name}...")
        doc = fitz.open(pdf_path)
        page = doc.load_page(0)
        pix = page.get_pixmap(dpi=150)
        pix.save(img_path)
        print(f"Saved to {img_path}")
        doc.close()
    else:
        print(f"File not found: {pdf_path}")
