# check_encoding.py - Jalankan di root frontend/
# Usage: python check_encoding.py

import os
import sys

def check_file(filepath):
    with open(filepath, 'rb') as f:
        raw = f.read()
    
    # Cek apakah file valid UTF-8
    try:
        text = raw.decode('utf-8')
        # Cek apakah ada double-encoded UTF-8 (mojibake)
        # Double-encoded: karakter UTF-8 yang byte-nya di-encode lagi sebagai UTF-8
        # Cirinya: ada sequence seperti C3 A2 C2 (â diikuti C2)
        suspicious = 0
        i = 0
        while i < len(raw) - 2:
            # C3 A2 = â dalam UTF-8, tapi kalau diikuti C2 xx, mungkin double-encoded
            if raw[i] == 0xC3 and raw[i+1] == 0xA2 and i+2 < len(raw) and raw[i+2] == 0xC2:
                suspicious += 1
            # C3 B0 = ð dalam UTF-8
            if raw[i] == 0xC3 and raw[i+1] == 0xB0:
                suspicious += 1
            i += 1
        
        return 'utf-8-ok', suspicious, len(text)
    except UnicodeDecodeError as e:
        return 'not-utf-8', 0, 0

# Scan semua .tsx dan .ts files
files_to_check = []
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', '.vercel')]
    for f in files:
        if f.endswith(('.tsx', '.ts')):
            files_to_check.append(os.path.join(root, f))

print(f"Checking {len(files_to_check)} files...\n")

corrupt_files = []
for fp in sorted(files_to_check):
    status, suspicious, chars = check_file(fp)
    if status != 'utf-8-ok':
        print(f"  NOT UTF-8: {fp}")
        corrupt_files.append(fp)
    elif suspicious > 0:
        print(f"  SUSPICIOUS ({suspicious} patterns): {fp}")
        corrupt_files.append(fp)

if not corrupt_files:
    print("✅ Semua file valid UTF-8 - tidak ada korupsi file!")
    print("   Tampilan aneh di grep hanya karena PowerShell terminal encoding.")
    print("   File asli sudah benar.")
else:
    print(f"\n⚠️  {len(corrupt_files)} file bermasalah ditemukan.")

print("\nDone.")