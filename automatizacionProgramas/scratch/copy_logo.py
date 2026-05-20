import shutil
import os

src = r"C:\Users\sergi\.gemini\antigravity\brain\ac46db35-1b94-4dcb-a1fa-7f6091115547\a_la_olla_logo_1779152750452.png"
dst = r"c:\Users\sergi\.gemini\antigravity\scratch\automatizacionProgramas\a_la_olla_logo.png"

try:
    shutil.copy(src, dst)
    print(f"File copied successfully to {dst}")
except Exception as e:
    print(f"Error copying file: {e}")
