# fix_encoding.py - Jalankan di root frontend/ kalau check_encoding.py menemukan file bermasalah
# Usage: python fix_encoding.py [--dry-run]
#
# Script ini memperbaiki file yang mengalami double-UTF-8 encoding:
# Byte UTF-8 asli -> dibaca sebagai Latin-1 -> di-encode ulang sebagai UTF-8
# Contoh: ✅ (E2 9C 85) -> â (C3 A2) + kontrolchar... -> muncul sebagai "âo."

import os
import sys
import shutil
from pathlib import Path

DRY_RUN = '--dry-run' in sys.argv

def try_fix_double_utf8(raw_bytes):
    """Coba decode file yang mengalami double-UTF-8 encoding."""
    # Strategi: decode UTF-8 -> encode Latin-1 -> decode UTF-8 lagi
    try:
        text = raw_bytes.decode('utf-8')
        # Coba encode ke Latin-1 (akan gagal kalau ada karakter non-Latin-1)
        latin1_bytes = text.encode('latin-1')
        # Coba decode sebagai UTF-8
        fixed = latin1_bytes.decode('utf-8')
        return fixed, True
    except (UnicodeDecodeError, UnicodeEncodeError):
        return None, False

def check_and_fix_file(filepath):
    with open(filepath, 'rb') as f:
        raw = f.read()
    
    # Cek tanda double-encoding: C3 A2 C2 pattern
    has_double = False
    for i in range(len(raw) - 2):
        if raw[i] == 0xC3 and raw[i+1] == 0xA2 and raw[i+2] == 0xC2:
            has_double = True
            break
        if raw[i] == 0xC3 and raw[i+1] == 0xB0:
            has_double = True
            break
    
    if not has_double:
        return 'ok', None
    
    fixed, success = try_fix_double_utf8(raw)
    if not success:
        return 'unfixable', None
    
    return 'fixable', fixed

# Scan files
files = []
for root, dirs, filenames in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', '.vercel')]
    for f in filenames:
        if f.endswith(('.tsx', '.ts')):
            files.append(os.path.join(root, f))

print(f"{'[DRY RUN] ' if DRY_RUN else ''}Scanning {len(files)} files...\n")

fixed_count = 0
for fp in sorted(files):
    status, fixed_content = check_and_fix_file(fp)
    if status == 'fixable':
        print(f"  {'[WOULD FIX]' if DRY_RUN else 'FIXED'}: {fp}")
        if not DRY_RUN:
            # Backup dulu
            backup = fp + '.bak'
            shutil.copy2(fp, backup)
            with open(fp, 'w', encoding='utf-8') as out:
                out.write(fixed_content)
        fixed_count += 1
    elif status == 'unfixable':
        print(f"  SKIP (cannot fix): {fp}")

print(f"\n{'Would fix' if DRY_RUN else 'Fixed'} {fixed_count} files.")
if not DRY_RUN and fixed_count > 0:
    print("Backup files (.bak) tersimpan - hapus manual kalau sudah yakin.")