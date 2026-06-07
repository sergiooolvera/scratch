import os
import sys

pdf_path = r"c:\Users\sergi\.gemini\antigravity\scratch\CursosIEDCH\public\CONSTANCIA 3.pdf"
output_dir = r"c:\Users\sergi\.gemini\antigravity\scratch\CursosIEDCH\public"

print("Trying to import pypdf or PyPDF2...")
try:
    import pypdf
    print("pypdf is installed!")
except ImportError:
    try:
        import PyPDF2 as pypdf
        print("PyPDF2 is installed!")
    except ImportError:
        print("Neither pypdf nor PyPDF2 is installed. Installing pypdf...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdf"])
        import pypdf

reader = pypdf.PdfReader(pdf_path)
page = reader.pages[0]

count = 0
for image_file_object in page.images:
    count += 1
    image_name = f"constancia_watermark_{count}.png"
    image_path = os.path.join(output_dir, image_name)
    with open(image_path, "wb") as fp:
        fp.write(image_file_object.data)
    print(f"Saved image to: {image_path}")

if count == 0:
    print("No images found in the first page of the PDF.")
