"""
KawalTransaksi — Advanced Scanner (Part 2)
15 additional checks: duplicate code, dead exports, accessibility, SSR safety, etc.
Run from project root: python scan_advanced.py
"""

import os, re, sys, json, hashlib
from pathlib import Path
from collections import defaultdict

# ── Config ────────────────────────────────────────────────────────────────────

SCAN_DIRS = ['frontend', 'backend']
SKIP_DIRS = {'node_modules','.next','.vercel','__pycache__','.git','dist','.wrangler','public'}
EXT_CODE  = {'.tsx','.ts','.js','.mjs','.cjs'}

# ── Colors ────────────────────────────────────────────────────────────────────

def c(t,n): return f'\033[{n}m{t}\033[0m'
def red(t):    return c(t,'91')
def yellow(t): return c(t,'93')
def green(t):  return c(t,'92')
def cyan(t):   return c(t,'96')
def bold(t):   return c(t,'1')
def dim(t):    return c(t,'2')

# ── File helpers ──────────────────────────────────────────────────────────────

def get_files(exts=None):
    files = []
    for d in SCAN_DIRS:
        if not os.path.exists(d): continue
        for root,dirs,names in os.walk(d):
            dirs[:] = [x for x in dirs if x not in SKIP_DIRS]
            for f in names:
                if Path(f).suffix in (exts or EXT_CODE):
                    files.append(os.path.join(root,f))
    return sorted(files)

def read(fp):
    try:
        with open(fp,'r',encoding='utf-8') as f: return f.read()
    except: return None

def lines(fp):
    t = read(fp)
    return t.splitlines() if t else []

def Issue(fp,line=0,text='',label='',sev='warn'):
    return (fp,line,text.strip()[:120],label,sev)

# ── 1. Duplicate Code Blocks ──────────────────────────────────────────────────

def scan_duplicate_code(files):
    issues = []
    BLOCK_SIZE = 6  # min baris untuk dianggap duplikat
    hashes = defaultdict(list)

    for fp in files:
        ls = lines(fp)
        for i in range(len(ls) - BLOCK_SIZE):
            block = '\n'.join(l.strip() for l in ls[i:i+BLOCK_SIZE] if l.strip())
            if len(block) < 100: continue  # skip blok terlalu pendek
            h = hashlib.md5(block.encode()).hexdigest()
            hashes[h].append((fp, i+1, block[:80]))

    seen = set()
    for h, locations in hashes.items():
        if len(locations) >= 2:
            # Dedup per file pair
            files_involved = list({fp for fp,_,_ in locations})
            if len(files_involved) >= 2:
                key = tuple(sorted(files_involved[:2]))
                if key not in seen:
                    seen.add(key)
                    fp1, ln1, preview = locations[0]
                    fp2, ln2, _       = locations[1]
                    issues.append(Issue(fp1, ln1, preview,
                        f'Duplicate code dengan {os.path.basename(fp2)}:{ln2}','warn'))
    return issues

# ── 2. Dead Exports ───────────────────────────────────────────────────────────

def scan_dead_exports(files):
    issues = []
    export_re = re.compile(r'export\s+(?:const|function|class|type|interface|enum)\s+(\w+)')
    import_re = re.compile(r'import\s+.*?(\w+).*?from')

    # Kumpulkan semua exported names
    exports = {}  # name -> fp
    for fp in files:
        for line in lines(fp):
            for m in export_re.finditer(line):
                name = m.group(1)
                if name not in {'default'} and not name.startswith('_'):
                    exports[name] = fp

    # Kumpulkan semua imported names
    all_imports = set()
    for fp in files:
        text = read(fp)
        if not text: continue
        # Named imports: import { X, Y } from ...
        for m in re.finditer(r'import\s*\{([^}]+)\}', text):
            for name in m.group(1).split(','):
                all_imports.add(name.strip().split(' as ')[0].strip())
        # Default & namespace imports
        for m in re.finditer(r'import\s+(\w+)\s+from', text):
            all_imports.add(m.group(1))
        # Dynamic imports
        for m in re.finditer(r'import\(["\']([^"\']+)["\']\)', text):
            all_imports.add(os.path.basename(m.group(1)).replace('.ts','').replace('.tsx',''))

    skip_names = {'default','App','Page','Layout','metadata','viewport','revalidate',
                  'generateMetadata','generateStaticParams','GET','POST','PUT','PATCH',
                  'DELETE','HEAD','OPTIONS','config'}

    for name, fp in exports.items():
        if name in skip_names: continue
        if name not in all_imports:
            # Cek apakah nama ada di teks lain (bukan sebagai import)
            used = any(name in (read(f) or '') for f in files if f != fp)
            if not used:
                issues.append(Issue(fp, 0, '', f'Dead export: `{name}` tidak diimport siapapun','warn'))
    return issues

# ── 3. Missing Test Files ─────────────────────────────────────────────────────

def scan_missing_tests(files):
    issues = []
    test_files = {f for f in files if '.test.' in f or '.spec.' in f}
    tested = set()
    for tf in test_files:
        base = os.path.basename(tf).replace('.test.ts','').replace('.test.tsx','').replace('.spec.ts','').replace('.spec.tsx','')
        tested.add(base)

    # Cek file penting yang tidak ada test-nya
    important = [f for f in files if
                 ('features' in f or 'core' in f or 'utils' in f) and
                 not any(x in f for x in ['.test.','.spec.','__tests__']) and
                 f.endswith(('.ts','.tsx'))]

    for fp in important:
        base = os.path.splitext(os.path.basename(fp))[0]
        if base not in tested and base not in {'index','types','constants'}:
            issues.append(Issue(fp, 0, '', f'Tidak ada test file untuk: {base}','warn'))
    return issues

# ── 4. Package.json engines ───────────────────────────────────────────────────

def scan_engines():
    issues = []
    for d in SCAN_DIRS:
        pkg_path = os.path.join(d, 'package.json')
        if not os.path.exists(pkg_path): continue
        try:
            pkg = json.loads(open(pkg_path).read())
            if 'engines' not in pkg:
                issues.append(Issue(pkg_path, 0, '', 'Tidak ada field "engines" di package.json (Node.js version)','warn'))
            if 'packageManager' not in pkg:
                issues.append(Issue(pkg_path, 0, '', 'Tidak ada field "packageManager" di package.json','warn'))
        except: pass
    return issues

# ── 5. Accessibility — Button tanpa label ────────────────────────────────────

def scan_accessibility(files):
    issues = []
    for fp in files:
        if 'frontend' not in fp: continue
        ls = lines(fp)
        for i, line in enumerate(ls, 1):
            # Button icon-only tanpa aria-label
            if '<button' in line and 'aria-label' not in line:
                # Cek apakah ada teks di baris yang sama atau baris berikutnya
                ctx = ''.join(ls[i-1:min(len(ls),i+3)])
                has_text = bool(re.search(r'<button[^>]*>[^<\s{][^<]*</button>', ctx))
                has_aria = 'aria-label' in ctx or 'aria-labelledby' in ctx
                if not has_text and not has_aria:
                    issues.append(Issue(fp, i, line, 'Button tanpa aria-label atau teks visible','warn'))

            # Input tanpa label
            if '<input' in line and 'type=' in line:
                if 'type="hidden"' not in line and 'type="submit"' not in line:
                    ctx = ''.join(ls[max(0,i-3):i+3])
                    if '<label' not in ctx and 'aria-label' not in ctx and 'placeholder' not in ctx:
                        issues.append(Issue(fp, i, line, 'Input tanpa label/aria-label/placeholder','warn'))

            # img tag (bukan Next.js Image) tanpa alt
            if re.search(r'<img\b', line) and 'alt=' not in line:
                issues.append(Issue(fp, i, line, '<img> tanpa alt attribute','error'))

    return issues

# ── 6. Image Optimization ─────────────────────────────────────────────────────

def scan_image_optimization():
    issues = []
    public_dir = 'frontend/public'
    if not os.path.exists(public_dir): return issues

    large_images = []
    unoptimized_formats = []

    for root, dirs, names in os.walk(public_dir):
        for name in names:
            fp  = os.path.join(root, name)
            ext = Path(name).suffix.lower()
            if ext in {'.png','.jpg','.jpeg','.gif','.bmp'}:
                size_kb = os.path.getsize(fp) / 1024
                if size_kb > 200:
                    large_images.append((fp, size_kb))
                if ext in {'.bmp','.gif'}:
                    unoptimized_formats.append(fp)

    for fp, kb in large_images:
        issues.append(Issue(fp, 0, '', f'Gambar besar: {kb:.0f}KB — pertimbangkan kompresi/WebP','warn'))
    for fp in unoptimized_formats:
        issues.append(Issue(fp, 0, '', f'Format gambar tidak optimal: {Path(fp).suffix} — pakai WebP/PNG','warn'))
    return issues

# ── 7. Missing loading.tsx ────────────────────────────────────────────────────

def scan_missing_loading(files):
    issues = []
    page_dirs = set()
    for fp in files:
        if 'frontend' not in fp or not fp.endswith('page.tsx'): continue
        d = os.path.dirname(fp)
        # Hanya cek halaman yang punya data fetching
        text = read(fp)
        if text and ('supabase' in text or 'fetch(' in text or 'async' in text):
            page_dirs.add(d)

    for d in page_dirs:
        has_loading = any(os.path.exists(os.path.join(d,f)) for f in ['loading.tsx','loading.js'])
        if not has_loading:
            issues.append(Issue(os.path.join(d,'page.tsx'), 0, '',
                'Halaman async tanpa loading.tsx','warn'))
    return issues

# ── 8. Inconsistent Error Messages ───────────────────────────────────────────

def scan_error_messages(files):
    issues = []
    # Cek inkonsistensi: ada yang pakai titik di akhir, ada yang tidak
    msg_re  = re.compile(r'message:\s*["\']([^"\']{10,})["\']')
    all_msgs = []

    for fp in files:
        for i, line in enumerate(lines(fp), 1):
            for m in msg_re.finditer(line):
                all_msgs.append((fp, i, m.group(1)))

    with_dot    = sum(1 for _, _, msg in all_msgs if msg.endswith('.'))
    without_dot = sum(1 for _, _, msg in all_msgs if not msg.endswith('.'))
    total = len(all_msgs)

    if total > 10:
        ratio = with_dot / total if total > 0 else 0
        if 0.2 < ratio < 0.8:  # campuran signifikan
            issues.append(Issue('backend/src', 0, '',
                f'Inconsistent error messages: {with_dot} pakai titik, {without_dot} tidak','warn'))
    return issues

# ── 9. Missing Request Timeout ────────────────────────────────────────────────

def scan_missing_timeout(files):
    issues = []
    fetch_re   = re.compile(r'\bfetch\s*\(')
    timeout_re = re.compile(r'AbortController|AbortSignal|signal:|timeout:',re.I)
    for fp in files:
        text = read(fp)
        if not text or not fetch_re.search(text): continue
        fetch_count   = len(fetch_re.findall(text))
        timeout_count = len(timeout_re.findall(text))
        if fetch_count > 2 and timeout_count == 0:
            issues.append(Issue(fp, 0, '',
                f'{fetch_count} fetch() tanpa AbortController/timeout','warn'))
    return issues

# ── 10. localStorage di SSR ───────────────────────────────────────────────────

def scan_localstorage_ssr(files):
    issues = []
    ls_re     = re.compile(r'localStorage\.|sessionStorage\.')
    window_re = re.compile(r'typeof window|window\s*!==\s*["\']undefined["\']|useEffect')
    for fp in files:
        if 'frontend' not in fp: continue
        text = read(fp)
        if not text or not ls_re.search(text): continue
        ls_list = lines(fp)
        for i, line in enumerate(ls_list, 1):
            if ls_re.search(line):
                # Cek apakah ada window check di sekitarnya
                ctx = ''.join(ls_list[max(0,i-5):i+5])
                if not window_re.search(ctx):
                    issues.append(Issue(fp, i, line,
                        'localStorage/sessionStorage tanpa window check (SSR unsafe)','error'))
    return issues

# ── 11. Missing .gitignore entries ───────────────────────────────────────────

def scan_gitignore():
    issues = []
    gitignore_path = '.gitignore'
    required = ['.env.local','.env.production','.wrangler','*.key','*.pem','dist/','coverage/']

    if not os.path.exists(gitignore_path):
        issues.append(Issue(gitignore_path, 0, '', '.gitignore tidak ditemukan di root','error'))
        return issues

    content = read(gitignore_path) or ''
    for entry in required:
        base = entry.replace('*','').replace('/','')
        if base not in content and entry not in content:
            issues.append(Issue(gitignore_path, 0, '',
                f'Entry missing di .gitignore: {entry}','warn'))
    return issues

# ── 12. Missing Content-Type Validation ──────────────────────────────────────

def scan_content_type(files):
    issues = []
    upload_re  = re.compile(r'\.put\(|formData|\.arrayBuffer\(\)|file\.type')
    mime_re    = re.compile(r'ALLOWED_MIME|mime_type|file\.type|content.type|magic.bytes',re.I)
    for fp in files:
        if 'upload' not in fp.lower() and 'file' not in fp.lower(): continue
        text = read(fp)
        if not text: continue
        if upload_re.search(text) and not mime_re.search(text):
            issues.append(Issue(fp, 0, '',
                'Upload handler tanpa MIME type validation','error'))
    return issues

# ── 13. Recursive Function Safety ────────────────────────────────────────────

def scan_recursion(files):
    issues = []
    for fp in files:
        ls = lines(fp)
        fn_names = []
        for line in ls:
            m = re.search(r'(?:function|const)\s+(\w+)\s*(?:=\s*(?:async\s*)?\(|\()', line)
            if m: fn_names.append(m.group(1))

        text = read(fp) or ''
        for name in fn_names:
            if len(name) < 3: continue
            # Hitung berapa kali fungsi memanggil dirinya sendiri
            calls = len(re.findall(rf'\b{name}\s*\(', text))
            # Cek apakah ada base case (if/return sebelum recursive call)
            fn_body_re = re.compile(rf'(?:function\s+{name}|const\s+{name}\s*=)[^{{]*\{{(.*?)(?=\n(?:function|const|export|class|\Z))', re.DOTALL)
            m = fn_body_re.search(text)
            if m and calls > 1:
                body = m.group(1)
                has_base = bool(re.search(r'\breturn\b.*\n.*'+re.escape(name), body, re.DOTALL) or
                               re.search(r'if\s*\(.+\)\s*\n?\s*return', body))
                if not has_base and calls <= 3:  # hindari false positive
                    issues.append(Issue(fp, 0, '',
                        f'Rekursi tanpa base case yang jelas: {name}()','warn'))
    return issues

# ── 14. Typos in UI Strings ───────────────────────────────────────────────────

def scan_typos(files):
    issues = []
    # Common Indonesian/English typos di context UI
    typo_map = {
        r'\bberhasil berhasil\b': 'duplicate "berhasil"',
        r'\btidak tidak\b': 'duplicate "tidak"',
        r'\bdan dan\b': 'duplicate "dan"',
        r'\bthe the\b': 'duplicate "the"',
        r'\bthat that\b': 'duplicate "that"',
        r'\bSukses sukses\b': 'capitalization inconsistency',
        r'\bError error\b': 'capitalization inconsistency',
        r'[Ss]ucess': 'typo: "sucess" → "success"',
        r'[Rr]ecieve': 'typo: "recieve" → "receive"',
        r'[Oo]ccured': 'typo: "occured" → "occurred"',
        r'[Ss]eperate': 'typo: "seperate" → "separate"',
        r'[Aa]uthetication': 'typo: "authetication" → "authentication"',
        r'[Pp]assowrd': 'typo: "passowrd" → "password"',
        r'[Ee]mail adress': 'typo: "adress" → "address"',
        r'[Vv]erifiksi': 'typo: "verifiksi" → "verifikasi"',
        r'[Pp]engguan': 'typo: "pengguan" → "pengguna"',
        r'[Bb]erhasill': 'typo: "berhasill" → "berhasil"',
        r'[Gg]agall': 'typo: "gagall" → "gagal"',
    }
    for fp in files:
        for i, line in enumerate(lines(fp), 1):
            # Hanya cek di string literals
            if not ('"' in line or "'" in line or '`' in line): continue
            for pattern, label in typo_map.items():
                if re.search(pattern, line, re.I):
                    issues.append(Issue(fp, i, line, f'Possible typo: {label}','warn'))
    return issues

# ── 15. Missing CORS on Public Routes ────────────────────────────────────────

def scan_cors_missing(files):
    issues = []
    for fp in files:
        if 'backend' not in fp or 'route' not in fp: continue
        text = read(fp)
        if not text: continue
        # Cek apakah ada GET route publik tanpa authMiddleware
        has_public_get = bool(re.search(r'\.get\s*\(["\'][^"\']+["\'],\s*async', text))
        has_auth       = bool(re.search(r'authMiddleware|requireAdmin|cors', text))
        has_cors_setup = bool(re.search(r'cors\s*\(|CORS', text))
        if has_public_get and not has_auth and not has_cors_setup:
            issues.append(Issue(fp, 0, '',
                'Public GET route tanpa auth/CORS middleware','warn'))
    return issues

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(bold('\n🔬 KawalTransaksi Advanced Scanner (Part 2)'))
    print(bold('15 Additional Checks: Duplicates · Dead Code · A11y · SSR Safety · Typos · Infra'))
    print('='*70)

    files = get_files()
    print(f'Scanning {cyan(str(len(files)))} files\n')

    scanners = [
        ('🔁 Duplicate Code Blocks',               lambda: scan_duplicate_code(files)),
        ('💀 Dead Exports',                        lambda: scan_dead_exports(files)),
        ('🧪 Missing Test Files',                  lambda: scan_missing_tests(files)),
        ('📦 Package.json engines/packageManager', lambda: scan_engines()),
        ('♿ Accessibility (button/input/img)',    lambda: scan_accessibility(files)),
        ('🖼️  Image Optimization di /public',      lambda: scan_image_optimization()),
        ('⏳ Missing loading.tsx',                 lambda: scan_missing_loading(files)),
        ('💬 Inconsistent Error Messages',         lambda: scan_error_messages(files)),
        ('⏱️  Missing Request Timeout',             lambda: scan_missing_timeout(files)),
        ('🖥️  localStorage di SSR',                lambda: scan_localstorage_ssr(files)),
        ('📄 Missing .gitignore Entries',          lambda: scan_gitignore()),
        ('📤 Missing Content-Type Validation',     lambda: scan_content_type(files)),
        ('🔄 Rekursi tanpa Base Case',             lambda: scan_recursion(files)),
        ('✏️  Typos di UI Strings',                lambda: scan_typos(files)),
        ('🌐 Missing CORS di Public Routes',       lambda: scan_cors_missing(files)),
    ]

    total_errors = total_warns = 0

    for title, scanner in scanners:
        try: results = scanner()
        except Exception as e:
            print(f'{bold(title)}: {yellow(f"Skip ({e})")}')
            continue

        errors = [r for r in results if r[4]=='error']
        warns  = [r for r in results if r[4]=='warn']
        total_errors += len(errors)
        total_warns  += len(warns)

        if not results:  status = green('✅ Bersih')
        elif errors:     status = red(f'❌ {len(errors)} error')
        else:            status = yellow(f'⚠️  {len(warns)} warning')

        print(f'{bold(title)}: {status}')
        for fp,ln,text,label,sev in results[:3]:
            loc = f':{ln}' if ln else ''
            fn  = red if sev=='error' else yellow
            print(f'  {fn("→")} {dim(fp)}{loc}')
            if text: print(f'    {dim(text[:100])}')
        if len(results) > 3:
            print(f'  {dim(f"... dan {len(results)-3} lainnya")}')
        print()

    print('='*70)
    print(bold('📊 Ringkasan'))
    print(f'  File   : {cyan(str(len(files)))}')
    print(f'  Errors : {red(str(total_errors)) if total_errors else green("0")}')
    print(f'  Warns  : {yellow(str(total_warns)) if total_warns else green("0")}')

    if   total_errors == 0 and total_warns == 0: print(f'\n{green("✅ Semua bersih!")}')
    elif total_errors == 0:                      print(f'\n{yellow("⚠️  Ada warnings, tidak ada error kritis.")}')
    else:                                        print(f'\n{red("❌ Ada error kritis yang harus diperbaiki.")}')

    print(f'\n{dim("💡 Jalankan scan_project.py untuk 55 checks utama.")}')
    print()
    return 1 if total_errors > 0 else 0

if __name__ == '__main__':
    sys.exit(main())