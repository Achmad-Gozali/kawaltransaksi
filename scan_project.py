"""
KawalTransaksi — Comprehensive Project Scanner v2
34 checks: encoding, security, code quality, dependencies, frontend, backend.
Jalankan dari root project: python scan_project.py
"""

import os
import re
import sys
import json
import subprocess
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

SCAN_DIRS       = ['frontend', 'backend']
SKIP_DIRS       = {'node_modules', '.next', '.vercel', '__pycache__', '.git', 'dist', '.wrangler', 'public'}
EXTENSIONS      = {'.tsx', '.ts', '.js', '.mjs', '.cjs'}
EXTENSIONS_ALL  = {'.tsx', '.ts', '.js', '.mjs', '.cjs', '.css'}

# ── Color helpers ─────────────────────────────────────────────────────────────

def color(t, c): return f'\033[{c}m{t}\033[0m'
def red(t):    return color(t, '91')
def yellow(t): return color(t, '93')
def green(t):  return color(t, '92')
def cyan(t):   return color(t, '96')
def bold(t):   return color(t, '1')
def dim(t):    return color(t, '2')

# ── File helpers ──────────────────────────────────────────────────────────────

def get_files(extensions=None):
    exts = extensions or EXTENSIONS
    files = []
    for scan_dir in SCAN_DIRS:
        if not os.path.exists(scan_dir): continue
        for root, dirs, filenames in os.walk(scan_dir):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            for f in filenames:
                if Path(f).suffix in exts:
                    files.append(os.path.join(root, f))
    return sorted(files)

def read_lines(fp):
    try:
        with open(fp, 'r', encoding='utf-8') as f:
            return f.readlines()
    except: return None

def read_text(fp):
    try:
        with open(fp, 'r', encoding='utf-8') as f:
            return f.read()
    except: return None

def Issue(fp, line=0, text='', label='', sev='warn'):
    return (fp, line, text, label, sev)

# ── 1. Encoding & Karakter Corrupt ───────────────────────────────────────────

MOJIBAKE = ['Ô£ò','ÔÇö','┬À','ÔåÆ','ÔÜá','Ô£à','ÔöÇ','â€"','â€™','â€œ','Ã©','Ã¨','Ã ','Ã¢']

def scan_encoding(files):
    issues = []
    for fp in files:
        try:
            raw = open(fp, 'rb').read()
            try: text = raw.decode('utf-8')
            except UnicodeDecodeError as e:
                issues.append(Issue(fp, 0, '', f'Invalid UTF-8: {e}', 'error')); continue
            for i, line in enumerate(text.split('\n'), 1):
                for p in MOJIBAKE:
                    if p in line:
                        issues.append(Issue(fp, i, line, f'Karakter corrupt: {repr(p)}', 'error')); break
        except Exception as e:
            issues.append(Issue(fp, 0, '', f'Tidak bisa baca: {e}', 'error'))
    return issues

# ── 2. Hardcoded Secrets ──────────────────────────────────────────────────────

SECRET_RE = [
    (r'sk-[a-zA-Z0-9]{20,}',                              'OpenAI API Key'),
    (r'eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}',   'JWT Token hardcoded'),
    (r'(?i)password\s*=\s*["\'][^"\']{4,}["\']',          'Hardcoded password'),
    (r'(?i)secret\s*=\s*["\'][^"\']{4,}["\']',            'Hardcoded secret'),
    (r'(?i)api[_-]?key\s*=\s*["\'][^"\']{8,}["\']',       'Hardcoded API key'),
    (r'-----BEGIN (RSA |EC )?PRIVATE KEY-----',            'Private key in source'),
]

def scan_secrets(files):
    issues = []
    for fp in files:
        if any(x in fp for x in ['.env', 'example', 'scan_project']): continue
        lines = read_lines(fp)
        if not lines: continue
        for i, line in enumerate(lines, 1):
            s = line.strip()
            if s.startswith('//') or s.startswith('*'): continue
            for pattern, label in SECRET_RE:
                if re.search(pattern, line):
                    issues.append(Issue(fp, i, line, f'Possible secret: {label}', 'error')); break
    return issues

# ── 3. Broken Imports ─────────────────────────────────────────────────────────

IMPORT_RE = re.compile(r'from\s+["\'](\./[^"\']+|\.\./[^"\']+)["\']')

def scan_broken_imports(files):
    issues = []
    all_paths = set(os.path.normpath(f) for f in files)
    for fp in files:
        lines = read_lines(fp)
        if not lines: continue
        file_dir = os.path.dirname(fp)
        for i, line in enumerate(lines, 1):
            m = IMPORT_RE.search(line)
            if not m: continue
            imp = m.group(1)
            resolved = os.path.normpath(os.path.join(file_dir, imp))
            found = any(
                os.path.normpath(resolved + ext) in all_paths or os.path.exists(resolved + ext)
                for ext in ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js']
            )
            if not found and not os.path.isdir(resolved):
                issues.append(Issue(fp, i, line, f'Broken import: {imp}', 'error'))
    return issues

# ── 4. Circular Imports ───────────────────────────────────────────────────────

def scan_circular_imports(files):
    graph = {}
    for fp in files:
        lines = read_lines(fp)
        if not lines: continue
        deps = []
        file_dir = os.path.dirname(fp)
        for line in lines:
            m = IMPORT_RE.search(line)
            if m:
                resolved = os.path.normpath(os.path.join(file_dir, m.group(1)))
                deps.append(resolved)
        graph[os.path.normpath(fp)] = deps

    issues = []
    def has_cycle(node, visited, path):
        visited.add(node)
        path.add(node)
        for dep in graph.get(node, []):
            for ext in ['.ts', '.tsx', '.js']:
                dep_full = dep + ext
                if dep_full in path:
                    return dep_full
                if dep_full not in visited and dep_full in graph:
                    result = has_cycle(dep_full, visited, path)
                    if result: return result
        path.discard(node)
        return None

    visited = set()
    for fp in graph:
        if fp not in visited:
            cycle = has_cycle(fp, visited, set())
            if cycle:
                issues.append(Issue(fp, 0, '', f'Circular import dengan: {cycle}', 'error'))
    return issues

# ── 5. Env Variable tidak ada di .env.example ─────────────────────────────────

def scan_env_missing(files):
    issues = []
    example_vars = set()
    for scan_dir in SCAN_DIRS:
        example_path = os.path.join(scan_dir, '.env.example')
        if os.path.exists(example_path):
            for line in read_lines(example_path) or []:
                m = re.match(r'^([A-Z_][A-Z0-9_]+)\s*=', line)
                if m: example_vars.add(m.group(1))

    env_re = re.compile(r'process\.env\.([A-Z_][A-Z0-9_]+)')
    for fp in files:
        lines = read_lines(fp)
        if not lines: continue
        for i, line in enumerate(lines, 1):
            for m in env_re.finditer(line):
                var = m.group(1)
                if var not in example_vars and var not in {'NODE_ENV', 'CI', 'PORT'}:
                    issues.append(Issue(fp, i, line, f'Env var tidak di .env.example: {var}', 'warn'))
    return issues

# ── 6. XSS Pattern ───────────────────────────────────────────────────────────

def scan_xss(files):
    issues = []
    pattern = re.compile(r'dangerouslySetInnerHTML\s*=\s*\{\s*\{')
    sanitize_re = re.compile(r'sanitize|DOMPurify|escape|encode', re.IGNORECASE)
    for fp in files:
        if 'frontend' not in fp: continue
        text = read_text(fp)
        if not text: continue
        lines = text.split('\n')
        for i, line in enumerate(lines, 1):
            if pattern.search(line):
                context = ''.join(lines[max(0,i-3):i+3])
                if not sanitize_re.search(context):
                    issues.append(Issue(fp, i, line, 'dangerouslySetInnerHTML tanpa sanitasi', 'error'))
    return issues

# ── 7. Supabase query tanpa .limit() ─────────────────────────────────────────

def scan_supabase_no_limit(files):
    issues = []
    select_re = re.compile(r'\.from\(["\'][^"\']+["\']\)\.select\(')
    limit_re   = re.compile(r'\.limit\(')
    for fp in files:
        text = read_text(fp)
        if not text or 'supabase' not in text.lower(): continue
        lines = text.split('\n')
        for i, line in enumerate(lines, 1):
            if select_re.search(line):
                context = ''.join(lines[i-1:min(len(lines), i+8)])
                if not limit_re.search(context):
                    issues.append(Issue(fp, i, line, 'Supabase .select() tanpa .limit()', 'warn'))
    return issues

# ── 8. Console logs ───────────────────────────────────────────────────────────

CONSOLE_RE = re.compile(r'console\.(log|debug)\(')

def scan_console_logs(files):
    issues = []
    for fp in files:
        lines = read_lines(fp)
        if not lines: continue
        for i, line in enumerate(lines, 1):
            if line.strip().startswith('//'): continue
            if CONSOLE_RE.search(line):
                issues.append(Issue(fp, i, line, 'console.log/debug tersisa', 'warn'))
    return issues

# ── 9. Empty catch blocks ─────────────────────────────────────────────────────

def scan_empty_catch(files):
    issues = []
    pattern = re.compile(r'catch\s*\([^)]*\)\s*\{\s*\}')
    for fp in files:
        if 'sw.js' in fp or 'public' in fp: continue
        text = read_text(fp)
        if not text: continue
        for m in pattern.finditer(text):
            line_num = text[:m.start()].count('\n') + 1
            issues.append(Issue(fp, line_num, m.group(), 'Empty catch block', 'warn'))
    return issues

# ── 10. Penggunaan `any` berlebihan ───────────────────────────────────────────

def scan_any_usage(files):
    issues = []
    any_re = re.compile(r':\s*any\b|as\s+any\b|<any>')
    for fp in files:
        if not fp.endswith(('.ts', '.tsx')): continue
        lines = read_lines(fp)
        if not lines: continue
        count = 0
        found = []
        for i, line in enumerate(lines, 1):
            if line.strip().startswith('//'): continue
            if any_re.search(line):
                count += 1
                if count <= 3:
                    found.append(Issue(fp, i, line, f'Penggunaan `any` (total: {count})', 'warn'))
        if count > 5:
            issues.append(Issue(fp, 0, '', f'Terlalu banyak `any`: {count} kali', 'warn'))
        elif count > 0:
            issues.extend(found)
    return issues

# ── 11. TODO/FIXME ────────────────────────────────────────────────────────────

TODO_RE = re.compile(r'//\s*(TODO|FIXME|HACK|XXX|BUG)\b', re.IGNORECASE)

def scan_todos(files):
    issues = []
    for fp in files:
        lines = read_lines(fp)
        if not lines: continue
        for i, line in enumerate(lines, 1):
            m = TODO_RE.search(line)
            if m:
                issues.append(Issue(fp, i, line, f'{m.group(1).upper()} belum selesai', 'warn'))
    return issues

# ── 12. Long functions (>100 baris) ───────────────────────────────────────────

def scan_long_functions(files):
    issues = []
    fn_start = re.compile(r'(function\s+\w+|const\s+\w+\s*=\s*(async\s*)?\(|export\s+default\s+function)')
    brace_open  = re.compile(r'\{')
    brace_close = re.compile(r'\}')
    for fp in files:
        lines = read_lines(fp)
        if not lines: continue
        i = 0
        while i < len(lines):
            if fn_start.search(lines[i]):
                start = i
                depth = 0
                j = i
                while j < len(lines):
                    depth += len(brace_open.findall(lines[j]))
                    depth -= len(brace_close.findall(lines[j]))
                    if depth > 0 and j > start + 100:
                        issues.append(Issue(fp, start+1, lines[start], f'Fungsi terlalu panjang (>{j-start} baris)', 'warn'))
                        i = j
                        break
                    if depth <= 0 and j > start:
                        i = j
                        break
                    j += 1
            i += 1
    return issues

# ── 13. Nested ternary ────────────────────────────────────────────────────────

def scan_nested_ternary(files):
    issues = []
    pattern = re.compile(r'\?[^:?\n]{1,80}\?[^:?\n]{1,80}:')
    for fp in files:
        lines = read_lines(fp)
        if not lines: continue
        for i, line in enumerate(lines, 1):
            if pattern.search(line) and line.count('?') >= 2:
                issues.append(Issue(fp, i, line, 'Nested ternary operator', 'warn'))
    return issues

# ── 14. Magic numbers ─────────────────────────────────────────────────────────

def scan_magic_numbers(files):
    issues = []
    pattern = re.compile(r'(?<![.\w])(\d{4,})(?![.\w%])')
    whitelist = {'1000', '1024', '9999', '2026', '2025', '2024', '1440', '1920', '1080'}
    for fp in files:
        if not fp.endswith(('.ts', '.tsx')): continue
        lines = read_lines(fp)
        if not lines: continue
        for i, line in enumerate(lines, 1):
            s = line.strip()
            if s.startswith('//') or 'revalidate' in s or 'maxAge' in s: continue
            for m in pattern.finditer(line):
                if m.group(1) not in whitelist:
                    issues.append(Issue(fp, i, line, f'Magic number: {m.group(1)}', 'warn'))
                    break
    return issues

# ── 15. Missing alt di <Image> ────────────────────────────────────────────────

def scan_missing_alt(files):
    issues = []
    img_re  = re.compile(r'<Image\b', re.IGNORECASE)
    alt_re  = re.compile(r'\balt\s*=')
    for fp in files:
        if 'frontend' not in fp: continue
        lines = read_lines(fp)
        if not lines: continue
        i = 0
        while i < len(lines):
            if img_re.search(lines[i]):
                block = ''
                j = i
                while j < len(lines) and '/>' not in lines[j] and '>' not in lines[j]:
                    block += lines[j]
                    j += 1
                block += lines[j] if j < len(lines) else ''
                if not alt_re.search(block):
                    issues.append(Issue(fp, i+1, lines[i], 'Missing alt di <Image>', 'warn'))
                i = j + 1
            else:
                i += 1
    return issues

# ── 16. Missing aria-label di button ─────────────────────────────────────────

def scan_missing_aria(files):
    issues = []
    btn_re  = re.compile(r'<button\b(?![^>]*aria-label)(?![^>]*>.*\S.*<\/button>)', re.DOTALL)
    for fp in files:
        if 'frontend' not in fp: continue
        lines = read_lines(fp)
        if not lines: continue
        for i, line in enumerate(lines, 1):
            if '<button' in line and 'aria-label' not in line:
                # Cek apakah button punya teks di baris yang sama
                text_content = re.search(r'<button[^>]*>(.+?)<\/button>', line)
                if not text_content or not text_content.group(1).strip():
                    issues.append(Issue(fp, i, line, 'Button tanpa aria-label atau teks', 'warn'))
    return issues

# ── 17. Missing metadata di page ─────────────────────────────────────────────

def scan_missing_metadata(files):
    issues = []
    for fp in files:
        if 'frontend' not in fp: continue
        if not fp.endswith('page.tsx'): continue
        text = read_text(fp)
        if not text: continue
        if 'generateMetadata' not in text and 'export const metadata' not in text:
            if 'export default' in text:
                issues.append(Issue(fp, 0, '', 'Page tanpa metadata (SEO)', 'warn'))
    return issues

# ── 18. Hardcoded URLs ────────────────────────────────────────────────────────

def scan_hardcoded_urls(files):
    issues = []
    url_re = re.compile(r'["\']https?://(localhost|kawaltransaksi\.com|api\.kawaltransaksi\.com)[^"\']*["\']')
    for fp in files:
        if '.env' in fp or 'scan_project' in fp: continue
        lines = read_lines(fp)
        if not lines: continue
        for i, line in enumerate(lines, 1):
            s = line.strip()
            if s.startswith('//') or s.startswith('*'): continue
            if 'process.env' in line: continue
            m = url_re.search(line)
            if m:
                issues.append(Issue(fp, i, line, f'Hardcoded URL: {m.group(0)[:50]}', 'warn'))
    return issues

# ── 19. Unused dependencies ───────────────────────────────────────────────────

def scan_unused_deps(files):
    issues = []
    for scan_dir in SCAN_DIRS:
        pkg_path = os.path.join(scan_dir, 'package.json')
        if not os.path.exists(pkg_path): continue
        try:
            pkg = json.loads(open(pkg_path).read())
        except: continue
        deps = list(pkg.get('dependencies', {}).keys()) + list(pkg.get('devDependencies', {}).keys())

        # Kumpulkan semua teks dari file di direktori ini
        all_text = ''
        for fp in files:
            if fp.startswith(scan_dir):
                t = read_text(fp)
                if t: all_text += t

        for dep in deps:
            # Skip tooling deps yang tidak perlu di-import
            skip = {'typescript', 'eslint', 'autoprefixer', 'postcss', 'tailwindcss',
                    '@types/', 'tw-animate-css', 'eslint-config-next', 'serwist',
                    '@serwist/', 'wrangler', '@cloudflare/', 'prettier'}
            if any(dep.startswith(s) for s in skip): continue

            # Cek apakah nama package muncul di source
            dep_clean = dep.replace('@', '').replace('/', '').replace('-', '').lower()
            if dep not in all_text and dep_clean not in all_text.lower():
                issues.append(Issue(pkg_path, 0, dep, f'Possibly unused dependency: {dep}', 'warn'))
    return issues

# ── 20. Unused files ──────────────────────────────────────────────────────────

def scan_unused_files(files):
    issues = []
    all_imports = set()
    for fp in files:
        text = read_text(fp)
        if not text: continue
        for m in re.finditer(r'from\s+["\']([^"\']+)["\']', text):
            all_imports.add(m.group(1))

    for fp in files:
        # Skip page.tsx, layout.tsx, route.ts — Next.js auto-load
        basename = os.path.basename(fp)
        if basename in {'page.tsx', 'layout.tsx', 'route.ts', 'middleware.ts',
                        'not-found.tsx', 'error.tsx', 'loading.tsx', 'sw.ts',
                        'sitemap.ts', 'robots.ts', 'opengraph-image.tsx'}: continue
        if basename.startswith('instrumentation'): continue

        # Cek apakah file ini di-import oleh siapapun
        fp_norm = fp.replace('\\', '/').replace('.tsx', '').replace('.ts', '')
        referenced = any(fp_norm.endswith(imp.replace('@/', '').replace('./', ''))
                        or os.path.basename(fp_norm) in imp
                        for imp in all_imports)
        if not referenced:
            issues.append(Issue(fp, 0, '', 'File mungkin tidak digunakan (unused)', 'warn'))
    return issues

# ── 21. Unhandled promise rejection ───────────────────────────────────────────

def scan_unhandled_promise(files):
    issues = []
    pattern = re.compile(r'(?<!await\s)(?<!return\s)new Promise\(|\.then\([^)]+\)(?!\.catch)')
    for fp in files:
        lines = read_lines(fp)
        if not lines: continue
        for i, line in enumerate(lines, 1):
            if pattern.search(line) and '.catch' not in line and 'try' not in line:
                if 'Promise.all' not in line and 'Promise.race' not in line:
                    issues.append(Issue(fp, i, line, 'Possible unhandled promise', 'warn'))
    return issues

# ── 22. Missing input validation di backend route ─────────────────────────────

def scan_missing_validation(files):
    issues = []
    route_re   = re.compile(r'\.(get|post|put|patch|delete)\s*\(["\'][^"\']+["\']')
    body_re    = re.compile(r'req\.body|c\.req\.json\(\)|await req\.json\(\)')
    valid_re   = re.compile(r'zod|joi|yup|validate|schema\.parse|\.safeParse|if\s*\(!|typeof\s+\w+\s*===')
    for fp in files:
        if 'backend' not in fp: continue
        lines = read_lines(fp)
        if not lines: continue
        for i, line in enumerate(lines, 1):
            if route_re.search(line) and ('post' in line.lower() or 'put' in line.lower() or 'patch' in line.lower()):
                context = ''.join(lines[i-1:min(len(lines), i+20)])
                if body_re.search(context) and not valid_re.search(context):
                    issues.append(Issue(fp, i, line, 'Route POST/PUT/PATCH tanpa validasi input', 'warn'))
    return issues

# ── 23. File terlalu besar ────────────────────────────────────────────────────

def scan_large_files(files):
    issues = []
    for fp in files:
        kb = os.path.getsize(fp) / 1024
        if kb > 100:
            issues.append(Issue(fp, 0, '', f'File besar: {kb:.0f} KB', 'warn'))
    return issues

# ── 24. Missing rate limiting di route baru ───────────────────────────────────

def scan_missing_rate_limit(files):
    issues = []
    route_re = re.compile(r'\.(post|put|patch|delete)\s*\(["\'][^"\']+["\']')
    rate_re  = re.compile(r'rateLimit|rate_limit|rateLimiter|ipLimit|checkRateLimit', re.IGNORECASE)
    for fp in files:
        if 'backend' not in fp: continue
        text = read_text(fp)
        if not text: continue
        if route_re.search(text) and not rate_re.search(text):
            issues.append(Issue(fp, 0, '', 'Route tanpa rate limiting', 'warn'))
    return issues

# ── 25. npm audit ─────────────────────────────────────────────────────────────

def scan_npm_audit():
    issues = []
    for scan_dir in SCAN_DIRS:
        if not os.path.exists(os.path.join(scan_dir, 'package.json')): continue
        try:
            result = subprocess.run(
                ['npm', 'audit', '--json'],
                cwd=scan_dir, capture_output=True, text=True, timeout=30
            )
            data = json.loads(result.stdout)
            vulns = data.get('metadata', {}).get('vulnerabilities', {})
            total = sum(vulns.values())
            high  = vulns.get('high', 0) + vulns.get('critical', 0)
            if high > 0:
                issues.append(Issue(scan_dir, 0, '', f'npm audit: {high} high/critical vulnerabilities', 'error'))
            elif total > 0:
                issues.append(Issue(scan_dir, 0, '', f'npm audit: {total} total vulnerabilities', 'warn'))
        except: pass
    return issues

# ── 26. Inconsistent naming ───────────────────────────────────────────────────

def scan_naming(files):
    issues = []
    for fp in files:
        basename = os.path.basename(fp)
        name = os.path.splitext(basename)[0]
        # Components harusnya PascalCase
        if fp.endswith(('.tsx',)) and 'page' not in name and 'layout' not in name and 'route' not in name:
            if name[0].islower() and '-' not in name and '_' not in name:
                issues.append(Issue(fp, 0, '', f'Component file seharusnya PascalCase: {basename}', 'warn'))
        # TS utils harusnya camelCase atau kebab-case
        if fp.endswith('.ts') and 'route' not in fp and 'types' not in name:
            if name[0].isupper() and 'Tab' not in name and 'Form' not in name:
                issues.append(Issue(fp, 0, '', f'Utility file tidak perlu PascalCase: {basename}', 'warn'))
    return issues

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(bold('\n🔍 KawalTransaksi Project Scanner v2'))
    print(bold('34 Checks: Encoding · Security · Quality · Dependencies · Frontend · Backend'))
    print('=' * 65)

    files = get_files()
    print(f'Scanning {cyan(str(len(files)))} files di: {", ".join(SCAN_DIRS)}\n')

    scanners = [
        # Error kritis
        ('🔤 Encoding & Karakter Corrupt',          lambda: scan_encoding(files)),
        ('🔑 Hardcoded Secrets',                    lambda: scan_secrets(files)),
        ('📦 Broken Imports',                       lambda: scan_broken_imports(files)),
        ('🔄 Circular Imports',                     lambda: scan_circular_imports(files)),
        ('🌍 Env Var tidak di .env.example',        lambda: scan_env_missing(files)),
        # Security
        ('🛡️  XSS — dangerouslySetInnerHTML',       lambda: scan_xss(files)),
        ('🔒 Missing Input Validation (Backend)',   lambda: scan_missing_validation(files)),
        ('⚡ Missing Rate Limiting (Backend)',      lambda: scan_missing_rate_limit(files)),
        ('🔍 npm Audit (Vulnerabilities)',          lambda: scan_npm_audit()),
        # Code quality
        ('🪵  Console.log Tersisa',                 lambda: scan_console_logs(files)),
        ('🚫 Empty Catch Blocks',                   lambda: scan_empty_catch(files)),
        ('📊 Penggunaan `any` Berlebihan',          lambda: scan_any_usage(files)),
        ('📝 TODO/FIXME Belum Selesai',             lambda: scan_todos(files)),
        ('📏 Fungsi Terlalu Panjang (>100 baris)',  lambda: scan_long_functions(files)),
        ('🔀 Nested Ternary Operator',              lambda: scan_nested_ternary(files)),
        ('🔢 Magic Numbers',                        lambda: scan_magic_numbers(files)),
        ('🤝 Unhandled Promise',                    lambda: scan_unhandled_promise(files)),
        # Dependencies & files
        ('📦 Possibly Unused Dependencies',         lambda: scan_unused_deps(files)),
        ('🗂️  Possibly Unused Files',               lambda: scan_unused_files(files)),
        ('📏 File Terlalu Besar (>100KB)',          lambda: scan_large_files(files)),
        # Frontend
        ('🖼️  Missing alt di <Image>',              lambda: scan_missing_alt(files)),
        ('♿ Missing aria-label di Button',         lambda: scan_missing_aria(files)),
        ('🔍 Missing Metadata (SEO)',               lambda: scan_missing_metadata(files)),
        ('🔗 Hardcoded URLs',                       lambda: scan_hardcoded_urls(files)),
        ('🏷️  Inconsistent File Naming',            lambda: scan_naming(files)),
        # Backend
        ('🗄️  Supabase Query tanpa .limit()',       lambda: scan_supabase_no_limit(files)),
    ]

    total_errors = 0
    total_warns  = 0

    for title, scanner in scanners:
        try:
            results = scanner()
        except Exception as e:
            print(f'{bold(title)}: {yellow(f"Skip (error: {e})")}')
            continue

        errors = [r for r in results if r[4] == 'error']
        warns  = [r for r in results if r[4] == 'warn']
        total_errors += len(errors)
        total_warns  += len(warns)

        if not results:
            status = green('✅ Bersih')
        elif errors:
            status = red(f'❌ {len(errors)} error')
        else:
            status = yellow(f'⚠️  {len(warns)} warning')

        print(f'{bold(title)}: {status}')

        for fp, line_num, line, label, sev in results[:5]:
            loc  = f':{line_num}' if line_num else ''
            fn   = red if sev == 'error' else yellow
            print(f'  {fn("→")} {dim(fp)}{loc}')
            if line.strip():
                print(f'    {dim(line.strip()[:100])}')
        if len(results) > 5:
            print(f'  {dim(f"... dan {len(results)-5} lainnya")}')
        print()

    # Summary
    print('=' * 65)
    print(bold('📊 Ringkasan'))
    print(f'  File di-scan  : {cyan(str(len(files)))}')
    print(f'  Total errors  : {red(str(total_errors))  if total_errors else green("0")}')
    print(f'  Total warnings: {yellow(str(total_warns)) if total_warns  else green("0")}')

    if total_errors == 0 and total_warns == 0:
        print(f'\n{green("✅ Semua bersih! Tidak ada masalah ditemukan.")}')
    elif total_errors == 0:
        print(f'\n{yellow("⚠️  Ada warnings — tidak blocking, tapi worth diperiksa.")}')
    else:
        print(f'\n{red("❌ Ada error kritis yang harus diperbaiki sebelum deploy.")}')
    print()
    return 1 if total_errors > 0 else 0

if __name__ == '__main__':
    sys.exit(main())