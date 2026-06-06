import os
import sys
import subprocess

pdf_path = r"c:\Users\sergi\.gemini\antigravity\scratch\CursosIEDCH\public\CONSTANCIA 3.pdf"
output_path = r"c:\Users\sergi\.gemini\antigravity\scratch\CursosIEDCH\public\constancia_watermark.png"

print("Checking for pymupdf...")
try:
    import fitz # PyMuPDF
    print("PyMuPDF (fitz) is installed!")
except ImportError:
    print("Installing pymupdf...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pymupdf"])
    import fitz

doc = fitz.open(pdf_path)
page = doc.load_page(0) # First page
pix = page.get_pixmap(dpi=150) # 150 DPI is usually good quality
pix.save(output_path)
print(f"Successfully converted first page of PDF to PNG: {output_path}")
doc.close()
