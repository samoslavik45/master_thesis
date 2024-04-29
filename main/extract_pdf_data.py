# extract_pdf_data.py
import fitz  # PyMuPDF
import re
import sys

def extract_keywords(pdf_path):
    doc = fitz.open(pdf_path)

    full_text = ""
    for page in doc:
        full_text += page.get_text()

    regex_pattern = r"Keywords\s*:\s*(.*)"
    matches = re.findall(regex_pattern, full_text, re.IGNORECASE)

    if matches:
        print(f"Nájdené kľúčové slová: {matches}")
    else:
        print("Žiadne kľúčové slová nenájdené.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        extract_keywords(sys.argv[1])
    else:
        print("Prosím, zadajte cestu k PDF súboru ako argument.")
