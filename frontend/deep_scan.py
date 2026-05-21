import os
import sys

def deep_check_file(filepath):
    with open(filepath, 'rb') as f:
        raw = f.read()
    
    # 1. Cek valid UTF-8
    try:
        text = raw.decode('utf-8')
    except UnicodeDecodeError as e:
        return 'INVALID_UTF8', str(e)
    
    # 2. Cek double-encoded UTF-8 patterns
    # Double-encoded: UTF-8 bytes dibaca sebagai Latin-1 lalu di-encode UTF-8 lagi
    # Pattern umum: C3 A2 = â, C3 B0 = ð (byte-byte ini seharusnya tidak muncul berbarengan dengan pola tertentu)
    
    suspicious_sequences = []
    i = 0
    while i < len(raw) - 3:
        # Pattern: C3 A2 diikuti C2 xx (double-encoded 3-byte UTF-8)
        if raw[i] == 0xC3 and raw[i+1] == 0xA2 and raw[i+2] == 0xC2:
            suspicious_sequences.append(f"offset {i}: C3 A2 C2 {raw[i+3]:02X}")
        # Pattern: C3 B0 (ð) diikuti uppercase letter (kemungkinan emoji corrupt)
        if raw[i] == 0xC3 and raw[i+1] == 0xB0 and 0x41 <= raw[i+2] <= 0x5A:
            suspicious_sequences.append(f"offset {i}: C3 B0 {raw[i+2]:02X} (ð + uppercase)")
        # Pattern: C3 A2 E2 (another double-encoding variant)
        if raw[i] == 0xC3 and raw[i+1] == 0xA2 and raw[i+2] == 0xE2:
            suspicious_sequences.append(f"offset {i}: C3 A2 E2 xx")
        i += 1
    
    # 3. Cek karakter yang seharusnya tidak ada di source code TypeScript/TSX
    # Mojibake characters: â (U+00E2), ð (U+00F0) dalam konteks tertentu
    mojibake_chars = []
    lines = text.split('\n')
    for line_num, line in enumerate(lines, 1):
        for char in line:
            cp = ord(char)
            # â (U+00E2) dan ð (U+00F0) jarang muncul di kode TypeScript/Indonesia
            # kecuali dalam string tertentu
            if cp in (0x00E2, 0x00F0, 0x00C3):
                # Tapi bisa juga ada di teks Indonesia yang valid
                # Skip kalau dalam konteks yang wajar
                context = line[max(0, line.index(char)-5):line.index(char)+10] if char in line else ''
                mojibake_chars.append((line_num, char, hex(cp), context[:30]))
                break  # max 1 per line biar tidak spam
    
    if suspicious_sequences:
        return 'DOUBLE_ENCODED', suspicious_sequences[:5]
    
    if mojibake_chars:
        return 'MOJIBAKE_SUSPECT', mojibake_chars[:3]
    
    return 'OK', None

# Scan semua file
files = []
for root, dirs, filenames in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', '.vercel', '__pycache__')]
    for f in filenames:
        if f.endswith(('.tsx', '.ts', '.css', '.js', '.mjs')):
            files.append(os.path.join(root, f))

print(f"Deep scanning {len(files)} files...\n")

results = {'OK': [], 'INVALID_UTF8': [], 'DOUBLE_ENCODED': [], 'MOJIBAKE_SUSPECT': []}

for fp in sorted(files):
    status, detail = deep_check_file(fp)
    results[status].append((fp, detail))

print(f"✅ OK: {len(results['OK'])} files")
print(f"❌ INVALID UTF-8: {len(results['INVALID_UTF8'])} files")
print(f"⚠️  DOUBLE ENCODED: {len(results['DOUBLE_ENCODED'])} files")
print(f"🔍 MOJIBAKE SUSPECT: {len(results['MOJIBAKE_SUSPECT'])} files")

if results['INVALID_UTF8']:
    print("\n=== INVALID UTF-8 ===")
    for fp, detail in results['INVALID_UTF8']:
        print(f"  {fp}: {detail}")

if results['DOUBLE_ENCODED']:
    print("\n=== DOUBLE ENCODED (file rusak beneran) ===")
    for fp, detail in results['DOUBLE_ENCODED']:
        print(f"  {fp}")
        for d in detail:
            print(f"    {d}")

if results['MOJIBAKE_SUSPECT']:
    print("\n=== MOJIBAKE SUSPECT ===")
    for fp, detail in results['MOJIBAKE_SUSPECT']:
        print(f"  {fp}")
        for line_num, char, cp, ctx in detail:
            print(f"    line {line_num}: char {cp} in: {ctx!r}")

print("\nDone.")