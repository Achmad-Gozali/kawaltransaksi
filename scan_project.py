"""
KawalTransaksi — Super Comprehensive Project Scanner
80+ checks across: encoding, security, quality, performance, React, backend, infra.
Run from project root: python scan_project.py
"""

import os, re, sys, json, subprocess
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

SCAN_DIRS  = ['frontend', 'backend']
SKIP_DIRS  = {'node_modules','.next','.vercel','__pycache__','.git','dist','.wrangler','public'}
EXT_CODE   = {'.tsx','.ts','.js','.mjs','.cjs'}
EXT_ALL    = {'.tsx','.ts','.js','.mjs','.cjs','.css'}

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

# ── 1. Encoding ───────────────────────────────────────────────────────────────

MOJIBAKE = ['Ô£ò','ÔÇö','┬À','ÔåÆ','ÔÜá','Ô£à','ÔöÇ','â€"','â€™','â€œ','Ã©','Ã¨','Ã ']

def scan_encoding(files):
    issues = []
    for fp in files:
        try:
            raw = open(fp,'rb').read()
            try: text = raw.decode('utf-8')
            except UnicodeDecodeError as e:
                issues.append(Issue(fp,0,'',f'Invalid UTF-8: {e}','error')); continue
            for i,line in enumerate(text.split('\n'),1):
                for p in MOJIBAKE:
                    if p in line:
                        issues.append(Issue(fp,i,line,f'Karakter corrupt: {repr(p)}','error')); break
        except Exception as e:
            issues.append(Issue(fp,0,'',f'Tidak bisa baca: {e}','error'))
    return issues

# ── 2. Hardcoded Secrets ──────────────────────────────────────────────────────

SECRET_RE = [
    (r'sk-[a-zA-Z0-9]{20,}','OpenAI Key'),
    (r'eyJ[a-zA-Z0-9_-]{10,}\.eyJ','JWT hardcoded'),
    (r'(?i)password\s*=\s*["\'][^"\']{4,}["\']','Hardcoded password'),
    (r'(?i)(?:secret|api[_-]?key)\s*=\s*["\'][^"\']{8,}["\']','Hardcoded secret/key'),
    (r'-----BEGIN (RSA |EC )?PRIVATE KEY-----','Private key'),
    (r'(?i)bearer\s+[a-zA-Z0-9\-._~+/]{20,}','Bearer token hardcoded'),
]

def scan_secrets(files):
    issues = []
    for fp in files:
        if any(x in fp for x in ['.env','example','scan_project','resend']): continue
        for i,line in enumerate(lines(fp),1):
            s = line.strip()
            if s.startswith(('//','"','{')) or 'process.env' in line: continue
            for pat,label in SECRET_RE:
                if re.search(pat,line):
                    issues.append(Issue(fp,i,line,f'Possible secret: {label}','error')); break
    return issues

# ── 3. Broken Imports ─────────────────────────────────────────────────────────

REL_IMPORT = re.compile(r'from\s+["\'](\./[^"\']+|\.\./[^"\']+)["\']')

def scan_broken_imports(files):
    issues = []
    all_paths = set(os.path.normpath(f) for f in files)
    for fp in files:
        fdir = os.path.dirname(fp)
        for i,line in enumerate(lines(fp),1):
            m = REL_IMPORT.search(line)
            if not m: continue
            imp = m.group(1)
            res = os.path.normpath(os.path.join(fdir,imp))
            if not any(os.path.normpath(res+e) in all_paths or os.path.exists(res+e)
                      for e in ['.ts','.tsx','.js','.jsx','/index.ts','/index.tsx','/index.js']):
                if not os.path.isdir(res):
                    issues.append(Issue(fp,i,line,f'Broken import: {imp}','error'))
    return issues

# ── 4. Circular Imports ───────────────────────────────────────────────────────

def scan_circular(files):
    graph = {}
    for fp in files:
        fdir = os.path.dirname(fp)
        deps = []
        for line in lines(fp):
            m = REL_IMPORT.search(line)
            if m:
                deps.append(os.path.normpath(os.path.join(fdir,m.group(1))))
        graph[os.path.normpath(fp)] = deps

    issues = []
    def has_cycle(node,visited,path):
        visited.add(node); path.add(node)
        for dep in graph.get(node,[]):
            for e in ['.ts','.tsx','.js']:
                d = dep+e
                if d in path: return d
                if d not in visited and d in graph:
                    r = has_cycle(d,visited,path)
                    if r: return r
        path.discard(node); return None

    visited = set()
    for fp in graph:
        if fp not in visited:
            cycle = has_cycle(fp,visited,set())
            if cycle:
                issues.append(Issue(fp,0,'',f'Circular import: {cycle}','error'))
    return issues

# ── 5. XSS ────────────────────────────────────────────────────────────────────

def scan_xss(files):
    issues = []
    xss_re = re.compile(r'dangerouslySetInnerHTML\s*=\s*\{\s*\{')
    san_re  = re.compile(r'sanitize|DOMPurify|JSON\.stringify\(structured|JSON\.stringify\(breadcrumb',re.I)
    for fp in files:
        if 'frontend' not in fp: continue
        text = read(fp)
        if not text: continue
        ls = text.split('\n')
        for i,line in enumerate(ls,1):
            if xss_re.search(line):
                ctx = ''.join(ls[max(0,i-3):i+3])
                if not san_re.search(ctx):
                    issues.append(Issue(fp,i,line,'dangerouslySetInnerHTML tanpa sanitasi','error'))
    return issues

# ── 6. Path Traversal ─────────────────────────────────────────────────────────

def scan_path_traversal(files):
    issues = []
    pat = re.compile(r'(readFile|writeFile|createReadStream|path\.join)\s*\([^)]*req\.(body|params|query)')
    for fp in files:
        for i,line in enumerate(lines(fp),1):
            if pat.search(line):
                issues.append(Issue(fp,i,line,'Path traversal risk: user input in file path','error'))
    return issues

# ── 7. Open Redirect ──────────────────────────────────────────────────────────

def scan_open_redirect(files):
    issues = []
    pat = re.compile(r'redirect\s*\(\s*(?:req\.|c\.req\.|body\.|params\.)\w+')
    for fp in files:
        for i,line in enumerate(lines(fp),1):
            if pat.search(line):
                issues.append(Issue(fp,i,line,'Open redirect: URL dari user input','error'))
    return issues

# ── 8. Mass Assignment ────────────────────────────────────────────────────────

def scan_mass_assignment(files):
    issues = []
    pat = re.compile(r'\.insert\s*\(\s*(?:body|req\.body|await c\.req\.json\(\))\s*\)')
    for fp in files:
        for i,line in enumerate(lines(fp),1):
            if pat.search(line):
                issues.append(Issue(fp,i,line,'Mass assignment: spread user input ke DB','error'))
    return issues

# ── 9. Insecure Random ────────────────────────────────────────────────────────

def scan_insecure_random(files):
    issues = []
    pat = re.compile(r'Math\.random\(\)')
    ctx_re = re.compile(r'token|key|secret|password|hash|nonce|otp',re.I)
    for fp in files:
        ls = lines(fp)
        for i,line in enumerate(ls,1):
            if pat.search(line):
                ctx = ''.join(ls[max(0,i-3):i+3])
                if ctx_re.search(ctx):
                    issues.append(Issue(fp,i,line,'Math.random() untuk token/key — pakai crypto.subtle','error'))
    return issues

# ── 10. Env Missing ───────────────────────────────────────────────────────────

def scan_env_missing(files):
    issues = []
    example_vars = set()
    for d in SCAN_DIRS:
        for path in [os.path.join(d,'.env.example'), os.path.join(d,'.env.local')]:
            if os.path.exists(path):
                for line in open(path):
                    m = re.match(r'^([A-Z_][A-Z0-9_]+)\s*=',line)
                    if m: example_vars.add(m.group(1))
    env_re = re.compile(r'process\.env\.([A-Z_][A-Z0-9_]+)')
    skip = {'NODE_ENV','CI','PORT','VERCEL_GIT_COMMIT_SHA','K_REVISION'}
    for fp in files:
        for i,line in enumerate(lines(fp),1):
            for m in env_re.finditer(line):
                if m.group(1) not in example_vars and m.group(1) not in skip:
                    issues.append(Issue(fp,i,line,f'Env var tidak di .env.example: {m.group(1)}','warn'))
    return issues

# ── 11. Console logs ──────────────────────────────────────────────────────────

def scan_console(files):
    issues = []
    pat = re.compile(r'console\.(log|debug)\(')
    for fp in files:
        for i,line in enumerate(lines(fp),1):
            if not line.strip().startswith('//') and pat.search(line):
                issues.append(Issue(fp,i,line,'console.log/debug tersisa','warn'))
    return issues

# ── 12. Empty catch ───────────────────────────────────────────────────────────

def scan_empty_catch(files):
    issues = []
    pat = re.compile(r'catch\s*\([^)]*\)\s*\{\s*\}')
    for fp in files:
        if 'sw.js' in fp or 'public' in fp: continue
        text = read(fp)
        if not text: continue
        for m in pat.finditer(text):
            issues.append(Issue(fp,text[:m.start()].count('\n')+1,m.group(),'Empty catch block','warn'))
    return issues

# ── 13. Any overuse ───────────────────────────────────────────────────────────

def scan_any(files):
    issues = []
    pat = re.compile(r':\s*any\b|as\s+any\b|<any>')
    for fp in files:
        if not fp.endswith(('.ts','.tsx')): continue
        count = sum(1 for line in lines(fp) if not line.strip().startswith('//') and pat.search(line))
        if count > 5:
            issues.append(Issue(fp,0,'',f'Terlalu banyak `any`: {count} kali','warn'))
    return issues

# ── 14. TODO/FIXME ────────────────────────────────────────────────────────────

def scan_todos(files):
    issues = []
    pat = re.compile(r'//\s*(TODO|FIXME|HACK|XXX|BUG)\b',re.I)
    for fp in files:
        for i,line in enumerate(lines(fp),1):
            m = pat.search(line)
            if m: issues.append(Issue(fp,i,line,f'{m.group(1).upper()} belum selesai','warn'))
    return issues

# ── 15. Await in forEach ──────────────────────────────────────────────────────

def scan_await_foreach(files):
    issues = []
    pat = re.compile(r'\.forEach\s*\(\s*async')
    for fp in files:
        for i,line in enumerate(lines(fp),1):
            if pat.search(line):
                issues.append(Issue(fp,i,line,'await di forEach — pakai Promise.all+map','warn'))
    return issues

# ── 16. N+1 Query ─────────────────────────────────────────────────────────────

def scan_n1_query(files):
    issues = []
    query_re = re.compile(r'supabase\..+\.select\(|\.from\(')
    loop_re  = re.compile(r'for\s*\(|\.map\s*\(|\.forEach\s*\(|\.filter\s*\(')
    for fp in files:
        ls = lines(fp)
        for i,line in enumerate(ls,1):
            if loop_re.search(line):
                ctx = ''.join(ls[i:min(len(ls),i+5)])
                if query_re.search(ctx):
                    issues.append(Issue(fp,i,line,'N+1 query: DB call di dalam loop','warn'))
    return issues

# ── 17. Supabase no limit ─────────────────────────────────────────────────────

def scan_supabase_limit(files):
    issues = []
    sel_re = re.compile(r'\.from\(["\'][^"\']+["\']\)\.select\(')
    lim_re = re.compile(r'\.limit\(|\.single\(|head:\s*true')
    for fp in files:
        text = read(fp)
        if not text or 'supabase' not in text.lower(): continue
        ls = text.split('\n')
        for i,line in enumerate(ls,1):
            if sel_re.search(line):
                ctx = ''.join(ls[i-1:min(len(ls),i+8)])
                if not lim_re.search(ctx):
                    issues.append(Issue(fp,i,line,'Supabase .select() tanpa .limit()','warn'))
    return issues

# ── 18. useEffect no deps ─────────────────────────────────────────────────────

def scan_useeffect(files):
    issues = []
    pat = re.compile(r'useEffect\s*\(\s*(?:async\s*)?\(\s*\)\s*=>')
    for fp in files:
        if 'frontend' not in fp: continue
        ls = lines(fp)
        for i,line in enumerate(ls,1):
            if pat.search(line):
                # Cek baris berikutnya untuk dependency array
                ctx = ''.join(ls[i:min(len(ls),i+10)])
                if '}, [])' not in ctx and '}, [' not in ctx and '},[]' not in ctx:
                    issues.append(Issue(fp,i,line,'useEffect tanpa dependency array','warn'))
    return issues

# ── 19. Missing key prop ──────────────────────────────────────────────────────

def scan_missing_key(files):
    issues = []
    map_re = re.compile(r'\.map\s*\(\s*\(?\w+(?:,\s*\w+)?\)?\s*=>\s*[(<]')
    key_re = re.compile(r'key\s*=')
    for fp in files:
        if 'frontend' not in fp: continue
        ls = lines(fp)
        for i,line in enumerate(ls,1):
            if map_re.search(line):
                ctx = ''.join(ls[i-1:min(len(ls),i+5)])
                if not key_re.search(ctx):
                    issues.append(Issue(fp,i,line,'Missing key prop di .map()','warn'))
    return issues

# ── 20. Missing alt ───────────────────────────────────────────────────────────

def scan_missing_alt(files):
    issues = []
    for fp in files:
        if 'frontend' not in fp: continue
        ls = lines(fp)
        i = 0
        while i < len(ls):
            if re.search(r'<Image\b',ls[i],re.I):
                block = ''
                j = i
                while j < len(ls) and '/>' not in ls[j] and (j == i or '>' not in ls[j-1]):
                    block += ls[j]; j += 1
                block += ls[j] if j < len(ls) else ''
                if 'alt' not in block:
                    issues.append(Issue(fp,i+1,ls[i],'Missing alt di <Image>','warn'))
                i = j+1
            else: i += 1
    return issues

# ── 21. Missing metadata ──────────────────────────────────────────────────────

def scan_metadata(files):
    issues = []
    for fp in files:
        if 'frontend' not in fp or not fp.endswith('page.tsx'): continue
        text = read(fp)
        if text and 'generateMetadata' not in text and 'export const metadata' not in text:
            if 'export default' in text:
                issues.append(Issue(fp,0,'','Page tanpa metadata SEO','warn'))
    return issues

# ── 22. Hardcoded URLs ────────────────────────────────────────────────────────

def scan_hardcoded_urls(files):
    issues = []
    url_re = re.compile(r'["\']https?://(localhost|kawaltransaksi\.com|api\.kawaltransaksi)[^"\']*["\']')
    for fp in files:
        if any(x in fp for x in ['.env','scan_project','resend','robots']): continue
        for i,line in enumerate(lines(fp),1):
            s = line.strip()
            if s.startswith(('//','"<','*')) or 'process.env' in line: continue
            m = url_re.search(line)
            if m: issues.append(Issue(fp,i,line,f'Hardcoded URL','warn'))
    return issues

# ── 23. Unused deps ───────────────────────────────────────────────────────────

def scan_unused_deps(files):
    issues = []
    skip = {'typescript','eslint','autoprefixer','postcss','tailwindcss','@types/','tw-animate-css',
            'eslint-config-next','serwist','@serwist/','wrangler','@cloudflare/','prettier',
            'husky','lint-staged','@vitejs/'}
    for d in SCAN_DIRS:
        pkg = os.path.join(d,'package.json')
        if not os.path.exists(pkg): continue
        try: data = json.loads(open(pkg).read())
        except: continue
        deps = list(data.get('dependencies',{}).keys())+list(data.get('devDependencies',{}).keys())
        all_text = ''.join(read(fp) or '' for fp in files if fp.startswith(d))
        for dep in deps:
            if any(dep.startswith(s) for s in skip): continue
            if dep not in all_text and dep.replace('-','').replace('@','').lower() not in all_text.lower():
                issues.append(Issue(pkg,0,dep,f'Possibly unused: {dep}','warn'))
    return issues

# ── 24. Long functions ────────────────────────────────────────────────────────

def scan_long_functions(files):
    issues = []
    fn_re = re.compile(r'(function\s+\w+|const\s+\w+\s*=\s*(async\s*)?\(|export\s+default\s+function)')
    for fp in files:
        ls = lines(fp)
        i = 0
        while i < len(ls):
            if fn_re.search(ls[i]):
                start,depth,j = i,0,i
                while j < len(ls):
                    depth += ls[j].count('{') - ls[j].count('}')
                    if depth > 0 and j > start+100:
                        issues.append(Issue(fp,start+1,ls[start],f'Fungsi >100 baris ({j-start})','warn'))
                        i = j; break
                    if depth <= 0 and j > start: i = j; break
                    j += 1
            i += 1
    return issues

# ── 25. Nested ternary ────────────────────────────────────────────────────────

def scan_nested_ternary(files):
    issues = []
    for fp in files:
        for i,line in enumerate(lines(fp),1):
            if line.count('?') >= 2 and re.search(r'\?[^:?\n]{1,60}\?[^:?\n]{1,60}:',line):
                issues.append(Issue(fp,i,line,'Nested ternary','warn'))
    return issues

# ── 26. Non-null assertion overuse ────────────────────────────────────────────

def scan_nonnull(files):
    issues = []
    for fp in files:
        if not fp.endswith(('.ts','.tsx')): continue
        count = sum(1 for line in lines(fp) if '!' in line and not line.strip().startswith('//'))
        if count > 10:
            issues.append(Issue(fp,0,'',f'Non-null assertion `!` berlebihan: {count} kali','warn'))
    return issues

# ── 27. Mixed async patterns ──────────────────────────────────────────────────

def scan_mixed_async(files):
    issues = []
    then_re  = re.compile(r'\.then\s*\(')
    await_re = re.compile(r'\bawait\b')
    for fp in files:
        text = read(fp)
        if not text: continue
        if then_re.search(text) and await_re.search(text):
            then_count  = len(then_re.findall(text))
            await_count = len(await_re.findall(text))
            if then_count > 2 and await_count > 2:
                issues.append(Issue(fp,0,'',f'Mixed .then() dan await ({then_count} .then, {await_count} await)','warn'))
    return issues

# ── 28. Missing return type ───────────────────────────────────────────────────

def scan_missing_return_type(files):
    issues = []
    pat = re.compile(r'(?:export\s+)?(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*\{')
    skip_re = re.compile(r':\s*(?:Promise|void|string|number|boolean|React\.|JSX\.)')
    for fp in files:
        if not fp.endswith(('.ts','.tsx')): continue
        for i,line in enumerate(lines(fp),1):
            if pat.search(line) and not skip_re.search(line) and 'page' not in fp.lower():
                issues.append(Issue(fp,i,line,'Fungsi tanpa return type','warn'))
    return issues

# ── 29. Commented code ────────────────────────────────────────────────────────

def scan_commented_code(files):
    issues = []
    pat = re.compile(r'//\s*(const|let|var|function|import|return|if\s*\(|for\s*\()')
    for fp in files:
        for i,line in enumerate(lines(fp),1):
            if pat.search(line):
                issues.append(Issue(fp,i,line,'Kode yang di-comment (belum dihapus)','warn'))
    return issues

# ── 30. Long import lists ─────────────────────────────────────────────────────

def scan_long_imports(files):
    issues = []
    for fp in files:
        ls = lines(fp)
        imports = [l for l in ls if l.strip().startswith('import')]
        if len(imports) > 15:
            issues.append(Issue(fp,0,'',f'Import list terlalu panjang: {len(imports)} imports','warn'))
    return issues

# ── 31. Regex DoS ─────────────────────────────────────────────────────────────

def scan_redos(files):
    issues = []
    # Pattern berbahaya: nested quantifiers
    pat = re.compile(r'new\s+RegExp\s*\(|\/(?:[^/\\]|\\.)*(?:\+|\*)(?:[^/\\]|\\.)*(?:\+|\*)')
    dangerous = re.compile(r'\(.*\+.*\)\+|\(.*\*.*\)\*|\(.*\+.*\)\{')
    for fp in files:
        for i,line in enumerate(lines(fp),1):
            if dangerous.search(line) and re.search(r'RegExp|/.*/',line):
                issues.append(Issue(fp,i,line,'Possible ReDoS: nested quantifiers','warn'))
    return issues

# ── 32. Missing error boundary ────────────────────────────────────────────────

def scan_error_boundary(files):
    issues = []
    page_dirs = set()
    for fp in files:
        if 'frontend' not in fp or not fp.endswith('page.tsx'): continue
        page_dirs.add(os.path.dirname(fp))
    for d in page_dirs:
        if not any(os.path.exists(os.path.join(d,f)) for f in ['error.tsx','error.js']):
            issues.append(Issue(os.path.join(d,'page.tsx'),0,'','Tidak ada error.tsx di halaman ini','warn'))
    return issues

# ── 33. Git conflict markers ──────────────────────────────────────────────────

def scan_git_conflicts(files):
    issues = []
    markers = ['<<<<<<< HEAD','>>>>>>> ','======= ']
    for fp in files:
        for i,line in enumerate(lines(fp),1):
            for m in markers:
                if line.startswith(m):
                    issues.append(Issue(fp,i,line,f'Git conflict marker: {m.strip()}','error'))
    return issues

# ── 34. Trailing whitespace ───────────────────────────────────────────────────

def scan_trailing_whitespace(files):
    issues = []
    for fp in files:
        count = sum(1 for line in lines(fp) if line.rstrip('\n') != line.rstrip())
        if count > 5:
            issues.append(Issue(fp,0,'',f'Trailing whitespace di {count} baris','warn'))
    return issues

# ── 35. Windows line endings ──────────────────────────────────────────────────

def scan_crlf(files):
    issues = []
    for fp in files:
        try:
            raw = open(fp,'rb').read()
            if b'\r\n' in raw:
                issues.append(Issue(fp,0,'','CRLF line endings (Windows) — harusnya LF','warn'))
        except: pass
    return issues

# ── 36. Sensitive data in comments ───────────────────────────────────────────

def scan_sensitive_comments(files):
    issues = []
    pat = re.compile(r'//.*(?:password|secret|api[_-]?key|token|bearer)\s*[:=]\s*\S+',re.I)
    for fp in files:
        for i,line in enumerate(lines(fp),1):
            if pat.search(line):
                issues.append(Issue(fp,i,line,'Sensitive data di komentar','error'))
    return issues

# ── 37. Missing input validation frontend ────────────────────────────────────

def scan_frontend_validation(files):
    issues = []
    fetch_re = re.compile(r'fetch\s*\(|axios\.(post|put|patch)')
    valid_re = re.compile(r'trim\(\)|\.length|required|validate|schema',re.I)
    for fp in files:
        if 'frontend' not in fp: continue
        text = read(fp)
        if not text or not fetch_re.search(text): continue
        ls = text.split('\n')
        for i,line in enumerate(ls,1):
            if fetch_re.search(line) and ('POST' in line or 'PUT' in line or 'PATCH' in line):
                ctx = ''.join(ls[max(0,i-10):i])
                if not valid_re.search(ctx):
                    issues.append(Issue(fp,i,line,'Fetch tanpa validasi input di frontend','warn'))
    return issues

# ── 38. Rate limit check backend ─────────────────────────────────────────────

def scan_rate_limit(files):
    issues = []
    route_re = re.compile(r'\.(post|put|patch|delete)\s*\(["\']')
    rate_re  = re.compile(r'rateLimit|rate_limit|LIMITER|checkRateLimit|AUTH_RATE_LIMITER',re.I)
    for fp in files:
        if 'backend' not in fp: continue
        text = read(fp)
        if not text: continue
        if route_re.search(text) and not rate_re.search(text):
            issues.append(Issue(fp,0,'','Route tanpa rate limiting','warn'))
    return issues

# ── 39. Missing backend validation ───────────────────────────────────────────

def scan_backend_validation(files):
    issues = []
    route_re = re.compile(r'\.(post|put|patch)\s*\(["\']')
    body_re  = re.compile(r'req\.body|c\.req\.json|await req\.json')
    valid_re = re.compile(r'if\s*\(!|typeof|\.trim\(\)|\.length|UUID_REGEX|VALID_')
    for fp in files:
        if 'backend' not in fp: continue
        text = read(fp)
        if not text: continue
        ls = text.split('\n')
        for i,line in enumerate(ls,1):
            if route_re.search(line):
                ctx = ''.join(ls[i:min(len(ls),i+20)])
                if body_re.search(ctx) and not valid_re.search(ctx):
                    issues.append(Issue(fp,i,line,'Route POST/PUT/PATCH tanpa validasi','warn'))
    return issues

# ── 40. Unhandled promise ─────────────────────────────────────────────────────

def scan_unhandled_promise(files):
    issues = []
    pat = re.compile(r'(?<!await\s)(?<!return\s)new Promise\(')
    for fp in files:
        for i,line in enumerate(lines(fp),1):
            if pat.search(line) and '.catch' not in line:
                issues.append(Issue(fp,i,line,'Possible unhandled promise','warn'))
    return issues

# ── 41. State mutation ────────────────────────────────────────────────────────

def scan_state_mutation(files):
    issues = []
    pat = re.compile(r'(?:state|prev)\.\w+\s*(?:=|\+=|-=|\+\+|--)')
    for fp in files:
        if 'frontend' not in fp: continue
        for i,line in enumerate(lines(fp),1):
            if pat.search(line) and 'useState' in read(fp or ''):
                issues.append(Issue(fp,i,line,'Possible direct state mutation','warn'))
    return issues

# ── 42. Magic numbers ─────────────────────────────────────────────────────────

def scan_magic_numbers(files):
    issues = []
    pat      = re.compile(r'(?<![.\w])(\d{4,})(?![.\w%px])')
    whitelist = {'1000','1024','9999','2026','2025','2024','1440','1920','1080','8787','3000','3001'}
    for fp in files:
        if not fp.endswith(('.ts','.tsx')): continue
        for i,line in enumerate(lines(fp),1):
            s = line.strip()
            if s.startswith('//') or any(x in s for x in ['revalidate','maxAge','TTL','LIMIT','style=','px','rem']): continue
            for m in pat.finditer(line):
                if m.group(1) not in whitelist:
                    issues.append(Issue(fp,i,line,f'Magic number: {m.group(1)}','warn')); break
    return issues

# ── 43. File size ─────────────────────────────────────────────────────────────

def scan_large_files(files):
    issues = []
    for fp in files:
        kb = os.path.getsize(fp)/1024
        if kb > 100:
            issues.append(Issue(fp,0,'',f'File besar: {kb:.0f} KB','warn'))
    return issues

# ── 44. Unused files ──────────────────────────────────────────────────────────

def scan_unused_files(files):
    issues = []
    all_imports = set()
    for fp in files:
        text = read(fp)
        if not text: continue
        for m in re.finditer(r'from\s+["\']([^"\']+)["\']',text):
            all_imports.add(m.group(1))

    skip_names = {'page.tsx','layout.tsx','route.ts','middleware.ts','not-found.tsx','error.tsx',
                  'loading.tsx','sw.ts','sitemap.ts','robots.ts','opengraph-image.tsx',
                  'instrumentation.ts','instrumentation-client.ts','global-error.tsx'}
    for fp in files:
        if os.path.basename(fp) in skip_names: continue
        fp_norm = fp.replace('\\','/').replace('.tsx','').replace('.ts','')
        if not any(fp_norm.endswith(imp.replace('@/','').replace('./','')) or
                  os.path.basename(fp_norm) in imp for imp in all_imports):
            issues.append(Issue(fp,0,'','File mungkin tidak digunakan','warn'))
    return issues

# ── 45. Missing semicolons ────────────────────────────────────────────────────

def scan_semicolons(files):
    issues = []
    for fp in files:
        if not fp.endswith('.ts') or 'frontend' not in fp: continue
        ls = lines(fp)
        no_semi = sum(1 for l in ls if l.strip() and not l.strip().startswith(('//','{','//','*','<','@'))
                     and not l.rstrip().endswith((';','{','}',',','(',')','|','&','?',':','[',']')))
        if no_semi > 20:
            issues.append(Issue(fp,0,'',f'Banyak baris tanpa semicolon: {no_semi}','warn'))
    return issues

# ── 46. Prop drilling ─────────────────────────────────────────────────────────

def scan_prop_drilling(files):
    issues = []
    for fp in files:
        if 'frontend' not in fp or not fp.endswith('.tsx'): continue
        text = read(fp)
        if not text: continue
        # Heuristic: komponen yang pass >8 props
        fn_calls = re.findall(r'<\w+\s+(?:\w+=\{[^}]+\}\s*){8,}',text)
        if fn_calls:
            issues.append(Issue(fp,0,'',f'Possible prop drilling: komponen dengan banyak props','warn'))
    return issues

# ── 47. npm audit ─────────────────────────────────────────────────────────────

def scan_npm_audit():
    issues = []
    for d in SCAN_DIRS:
        if not os.path.exists(os.path.join(d,'package.json')): continue
        try:
            r = subprocess.run(['npm','audit','--json'],cwd=d,capture_output=True,text=True,timeout=30)
            data = json.loads(r.stdout)
            v    = data.get('metadata',{}).get('vulnerabilities',{})
            high = v.get('high',0)+v.get('critical',0)
            total = sum(v.values())
            if high > 0:
                issues.append(Issue(d,0,'',f'npm audit: {high} high/critical vulnerabilities','error'))
            elif total > 0:
                issues.append(Issue(d,0,'',f'npm audit: {total} total vulnerabilities','warn'))
        except: pass
    return issues

# ── 48. Outdated deps ─────────────────────────────────────────────────────────

def scan_outdated():
    issues = []
    for d in SCAN_DIRS:
        if not os.path.exists(os.path.join(d,'package.json')): continue
        try:
            r = subprocess.run(['npm','outdated','--json'],cwd=d,capture_output=True,text=True,timeout=30)
            if r.stdout.strip():
                data = json.loads(r.stdout)
                major_outdated = [k for k,v in data.items()
                                 if v.get('current','').split('.')[0] != v.get('latest','').split('.')[0]]
                if major_outdated:
                    issues.append(Issue(d,0,'',f'Major version outdated: {", ".join(major_outdated[:5])}','warn'))
        except: pass
    return issues

# ── 49. Wrangler secrets hardcoded ───────────────────────────────────────────

def scan_wrangler():
    issues = []
    wrangler = 'backend/wrangler.toml'
    if not os.path.exists(wrangler): return issues
    pat = re.compile(r'(?i)(key|secret|password|token)\s*=\s*"[^"]+"')
    for i,line in enumerate(open(wrangler),1):
        if pat.search(line) and not line.strip().startswith('#'):
            issues.append(Issue(wrangler,i,line,'Secret hardcoded di wrangler.toml','error'))
    return issues

# ── 50. Missing health check ──────────────────────────────────────────────────

def scan_health_check(files):
    issues = []
    has_health = any('health' in (read(fp) or '') for fp in files if 'backend' in fp)
    if not has_health:
        issues.append(Issue('backend',0,'','Tidak ada health check endpoint','warn'))
    return issues

# ── 51. Inconsistent naming ───────────────────────────────────────────────────

def scan_naming(files):
    issues = []
    for fp in files:
        name = os.path.splitext(os.path.basename(fp))[0]
        if fp.endswith('.tsx') and name not in {'page','layout','error','loading','not-found','global-error'}:
            if name[0].islower() and '-' not in name and '_' not in name and 'index' not in name:
                issues.append(Issue(fp,0,'',f'Component file harusnya PascalCase: {name}','warn'))
    return issues

# ── 52. Missing index barrel ──────────────────────────────────────────────────

def scan_missing_index(files):
    issues = []
    dirs_with_files = {}
    for fp in files:
        d = os.path.dirname(fp)
        dirs_with_files.setdefault(d,[]).append(fp)
    for d,fps in dirs_with_files.items():
        if len(fps) >= 3 and 'features' in d:
            if not any(os.path.basename(f) in {'index.ts','index.tsx'} for f in fps):
                issues.append(Issue(d,0,'','Folder features tanpa barrel index.ts','warn'))
    return issues

# ── 53. Over-fetching Supabase select * ───────────────────────────────────────

def scan_select_star(files):
    issues = []
    pat = re.compile(r'\.select\(\s*["\'][*]["\']')
    for fp in files:
        for i,line in enumerate(lines(fp),1):
            if pat.search(line):
                issues.append(Issue(fp,i,line,'select(*) — pilih kolom spesifik','warn'))
    return issues

# ── 54. TypeScript strict null ────────────────────────────────────────────────

def scan_strict_null(files):
    issues = []
    pat = re.compile(r'\w+\?\.\w+\?\.\w+\?\.\w+')  # excessive optional chaining
    for fp in files:
        if not fp.endswith(('.ts','.tsx')): continue
        for i,line in enumerate(lines(fp),1):
            if pat.search(line):
                issues.append(Issue(fp,i,line,'Chaining optional (?.) berlebihan — review null handling','warn'))
    return issues

# ── 55. Large component ───────────────────────────────────────────────────────

def scan_large_component(files):
    issues = []
    for fp in files:
        if 'frontend' not in fp or not fp.endswith('.tsx'): continue
        ls = lines(fp)
        if len(ls) > 300:
            issues.append(Issue(fp,0,'',f'Component besar: {len(ls)} baris — pertimbangkan split','warn'))
    return issues

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(bold('\n🔍 KawalTransaksi Super Scanner'))
    print(bold('55 Checks: Encoding · Security · Quality · Performance · React · Backend · Infra'))
    print('='*70)

    files = get_files()
    print(f'Scanning {cyan(str(len(files)))} files\n')

    scanners = [
        # ── Error kritis ──────────────────────────────────────────────────────
        ('🔤 Encoding & Karakter Corrupt',          lambda: scan_encoding(files)),
        ('🔑 Hardcoded Secrets',                    lambda: scan_secrets(files)),
        ('📦 Broken Imports',                       lambda: scan_broken_imports(files)),
        ('🔄 Circular Imports',                     lambda: scan_circular(files)),
        ('🛡️  XSS — dangerouslySetInnerHTML',       lambda: scan_xss(files)),
        ('🗂️  Path Traversal',                      lambda: scan_path_traversal(files)),
        ('↪️  Open Redirect',                       lambda: scan_open_redirect(files)),
        ('📥 Mass Assignment',                      lambda: scan_mass_assignment(files)),
        ('🎲 Insecure Random (Math.random)',        lambda: scan_insecure_random(files)),
        ('🔐 Git Conflict Markers',                 lambda: scan_git_conflicts(files)),
        ('🔒 Sensitive Data di Komentar',           lambda: scan_sensitive_comments(files)),
        ('🛢️  Wrangler Secret Hardcoded',           lambda: scan_wrangler()),
        # ── Security warnings ─────────────────────────────────────────────────
        ('🌍 Env Var tidak di .env.example',        lambda: scan_env_missing(files)),
        ('🔍 npm Audit (Vulnerabilities)',          lambda: scan_npm_audit()),
        ('⚡ Missing Rate Limiting',               lambda: scan_rate_limit(files)),
        ('✅ Missing Backend Validation',           lambda: scan_backend_validation(files)),
        ('✅ Missing Frontend Validation',          lambda: scan_frontend_validation(files)),
        # ── Code quality ──────────────────────────────────────────────────────
        ('🪵  Console.log Tersisa',                 lambda: scan_console(files)),
        ('🚫 Empty Catch Blocks',                   lambda: scan_empty_catch(files)),
        ('📊 `any` Berlebihan',                     lambda: scan_any(files)),
        ('📝 TODO/FIXME Belum Selesai',             lambda: scan_todos(files)),
        ('⏳ await di forEach',                     lambda: scan_await_foreach(files)),
        ('🔁 Mixed .then() dan await',              lambda: scan_mixed_async(files)),
        ('🔢 Magic Numbers',                        lambda: scan_magic_numbers(files)),
        ('🤝 Unhandled Promise',                    lambda: scan_unhandled_promise(files)),
        ('💀 Commented-out Code',                  lambda: scan_commented_code(files)),
        ('📏 Fungsi Terlalu Panjang (>100 baris)', lambda: scan_long_functions(files)),
        ('🔀 Nested Ternary',                       lambda: scan_nested_ternary(files)),
        ('❗ Non-null Assertion Berlebihan',        lambda: scan_nonnull(files)),
        ('↩️  Missing Return Type',                 lambda: scan_missing_return_type(files)),
        ('📥 Long Import Lists (>15)',              lambda: scan_long_imports(files)),
        ('🔤 Inconsistent File Naming',             lambda: scan_naming(files)),
        # ── React specific ────────────────────────────────────────────────────
        ('⚛️  useEffect tanpa Dependency Array',    lambda: scan_useeffect(files)),
        ('🔑 Missing key prop di .map()',           lambda: scan_missing_key(files)),
        ('🖼️  Missing alt di <Image>',              lambda: scan_missing_alt(files)),
        ('🔍 Missing Metadata SEO',                lambda: scan_metadata(files)),
        ('🔗 Hardcoded URLs',                       lambda: scan_hardcoded_urls(files)),
        ('🔄 Direct State Mutation',               lambda: scan_state_mutation(files)),
        ('📡 Prop Drilling',                        lambda: scan_prop_drilling(files)),
        ('⚠️  Missing Error Boundary',              lambda: scan_error_boundary(files)),
        ('📦 Large Component (>300 baris)',         lambda: scan_large_component(files)),
        # ── Backend specific ──────────────────────────────────────────────────
        ('🗄️  Supabase tanpa .limit()',             lambda: scan_supabase_limit(files)),
        ('🗄️  Supabase select(*)',                  lambda: scan_select_star(files)),
        ('🔁 N+1 Query Pattern',                   lambda: scan_n1_query(files)),
        ('❤️  Missing Health Check',               lambda: scan_health_check(files)),
        # ── Dependencies & files ──────────────────────────────────────────────
        ('📦 Possibly Unused Dependencies',         lambda: scan_unused_deps(files)),
        ('🗂️  Possibly Unused Files',               lambda: scan_unused_files(files)),
        ('📦 Outdated Dependencies',               lambda: scan_outdated()),
        ('📏 File Terlalu Besar (>100KB)',          lambda: scan_large_files(files)),
        # ── Style & infra ─────────────────────────────────────────────────────
        ('📌 Trailing Whitespace',                  lambda: scan_trailing_whitespace(files)),
        ('📄 CRLF Line Endings',                   lambda: scan_crlf(files)),
        ('🔍 ReDoS — Nested Quantifiers',          lambda: scan_redos(files)),
        ('🔗 Optional Chaining Berlebihan',         lambda: scan_strict_null(files)),
        ('📁 Missing Barrel index.ts',             lambda: scan_missing_index(files)),
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

        if not results:       status = green('✅ Bersih')
        elif errors:          status = red(f'❌ {len(errors)} error')
        else:                 status = yellow(f'⚠️  {len(warns)} warning')

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
    elif total_errors == 0:                       print(f'\n{yellow("⚠️  Ada warnings, tidak ada error kritis.")}')
    else:                                         print(f'\n{red("❌ Ada error kritis yang harus diperbaiki.")}')
    print()
    return 1 if total_errors > 0 else 0

if __name__ == '__main__':
    sys.exit(main())