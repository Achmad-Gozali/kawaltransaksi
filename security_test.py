"""
KawalTransaksi — Security Test Suite
Active & passive security testing. Run from project root:
  python security_test.py --url https://api.kawaltransaksi.com
  python security_test.py --url http://localhost:8787 --verbose
"""

import sys, json, time, random, string, hashlib, base64, re, argparse, threading
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed

# ── Colors ────────────────────────────────────────────────────────────────────

def c(t, n): return f'\033[{n}m{t}\033[0m'
def red(t):    return c(t, '91')
def yellow(t): return c(t, '93')
def green(t):  return c(t, '92')
def cyan(t):   return c(t, '96')
def bold(t):   return c(t, '1')
def dim(t):    return c(t, '2')
def magenta(t):return c(t, '95')

# ── HTTP Helper ───────────────────────────────────────────────────────────────

def http(url, method='GET', body=None, headers=None, timeout=10):
    """Simple HTTP request, returns (status, headers_dict, body_str, elapsed_ms)"""
    h = {'Content-Type': 'application/json', 'User-Agent': 'KWT-SecurityTest/1.0'}
    if headers: h.update(headers)
    data = json.dumps(body).encode() if body else None
    req  = Request(url, data=data, headers=h, method=method)
    t0   = time.time()
    try:
        with urlopen(req, timeout=timeout) as resp:
            elapsed = int((time.time() - t0) * 1000)
            return resp.status, dict(resp.headers), resp.read().decode('utf-8', errors='replace'), elapsed
    except HTTPError as e:
        elapsed = int((time.time() - t0) * 1000)
        try: body_text = e.read().decode('utf-8', errors='replace')
        except: body_text = ''
        return e.code, dict(e.headers), body_text, elapsed
    except URLError as e:
        return 0, {}, str(e), int((time.time() - t0) * 1000)
    except Exception as e:
        return 0, {}, str(e), 0

def rand_str(n=8):
    return ''.join(random.choices(string.ascii_lowercase, k=n))

# ── Result tracker ────────────────────────────────────────────────────────────

class Results:
    def __init__(self):
        self.passed  = []
        self.failed  = []
        self.info    = []
        self.lock    = threading.Lock()

    def ok(self, label, detail=''):
        with self.lock: self.passed.append((label, detail))
        print(f'  {green("✅")} {label}' + (f' — {dim(detail)}' if detail else ''))

    def fail(self, label, detail=''):
        with self.lock: self.failed.append((label, detail))
        print(f'  {red("❌")} {label}' + (f' — {red(detail)}' if detail else ''))

    def warn(self, label, detail=''):
        with self.lock: self.info.append((label, detail))
        print(f'  {yellow("⚠️ ")} {label}' + (f' — {yellow(detail)}' if detail else ''))

    def info_print(self, label, detail=''):
        with self.lock: self.info.append((label, detail))
        print(f'  {cyan("ℹ️ ")} {label}' + (f' — {dim(detail)}' if detail else ''))

R = Results()

# ════════════════════════════════════════════════════════════════
# 1. RECONNAISSANCE
# ════════════════════════════════════════════════════════════════

def test_recon(base):
    print(bold('\n🔍 1. Reconnaissance'))

    # Technology fingerprinting via headers
    status, headers, body, _ = http(base + '/health')
    server  = headers.get('Server', '')
    powered = headers.get('X-Powered-By', '')
    via     = headers.get('Via', '')
    if server:   R.warn('Server header exposed', server)
    else:        R.ok('Server header hidden')
    if powered:  R.warn('X-Powered-By exposed', powered)
    else:        R.ok('X-Powered-By hidden')

    # robots.txt
    status, _, body, _ = http(base + '/robots.txt')
    if status == 200:
        R.info_print('robots.txt accessible', f'{len(body)} bytes')
        paths = re.findall(r'Disallow:\s*(.+)', body)
        for p in paths[:5]: R.info_print(f'  Disallow: {p.strip()}')
    else:
        R.ok('robots.txt not found (normal for API)')

    # Common debug/admin endpoints
    debug_paths = [
        '/debug', '/actuator', '/actuator/health', '/actuator/env',
        '/__debug__', '/metrics', '/admin', '/phpmyadmin',
        '/.env', '/.git/config', '/config', '/api/debug',
        '/swagger', '/swagger-ui.html', '/api-docs', '/openapi.json',
        '/graphql', '/graphiql', '/_profiler', '/console',
        '/api/v2', '/api/v3', '/v1', '/v2',
    ]
    found_debug = []
    for path in debug_paths:
        status, _, _, _ = http(base + path, timeout=5)
        if status not in (404, 0, 403):
            found_debug.append(f'{path} ({status})')
    if found_debug:
        for p in found_debug: R.warn('Debug/hidden endpoint found', p)
    else:
        R.ok('No debug endpoints found')

    # HTTP methods on main endpoints
    for path in ['/api/auth/login', '/api/v1/check', '/health']:
        for method in ['OPTIONS', 'HEAD', 'TRACE', 'PUT', 'DELETE']:
            status, headers, _, _ = http(base + path, method=method, timeout=5)
            allow = headers.get('Allow', '')
            if method == 'TRACE' and status not in (404, 405, 0):
                R.warn('TRACE method enabled (XST risk)', f'{path} → {status}')
            if method == 'OPTIONS' and allow:
                R.info_print(f'OPTIONS {path}', f'Allow: {allow}')

    # SSL/TLS info
    parsed = urlparse(base)
    if parsed.scheme == 'https':
        R.ok('HTTPS enabled')
    else:
        R.warn('HTTP only — no HTTPS')

# ════════════════════════════════════════════════════════════════
# 2. SECURITY HEADERS
# ════════════════════════════════════════════════════════════════

def test_security_headers(base):
    print(bold('\n🛡️  2. Security Headers'))

    status, headers, _, _ = http(base + '/health')
    required_headers = {
        'X-Content-Type-Options':       'nosniff',
        'X-Frame-Options':              None,
        'Strict-Transport-Security':    None,
        'Content-Security-Policy':      None,
        'X-XSS-Protection':             None,
        'Referrer-Policy':              None,
        'Permissions-Policy':           None,
        'Cache-Control':                None,
    }
    headers_lower = {k.lower(): v for k, v in headers.items()}
    for header, expected in required_headers.items():
        val = headers_lower.get(header.lower())
        if val:
            if expected and expected.lower() not in val.lower():
                R.warn(f'{header} present but unexpected value', val)
            else:
                R.ok(f'{header}', val[:60])
        else:
            R.warn(f'Missing security header: {header}')

    # CORS headers check
    cors_headers = ['Access-Control-Allow-Origin', 'Access-Control-Allow-Methods',
                    'Access-Control-Allow-Credentials']
    for h in cors_headers:
        val = headers_lower.get(h.lower())
        if val:
            if h == 'Access-Control-Allow-Origin' and val == '*':
                R.warn('CORS wildcard (*) on all responses — check if intentional')
            else:
                R.ok(f'{h}', val[:60])

# ════════════════════════════════════════════════════════════════
# 3. AUTHENTICATION TESTS
# ════════════════════════════════════════════════════════════════

def test_authentication(base):
    print(bold('\n🔐 3. Authentication Tests'))

    # No token
    for path in ['/api/admin/articles', '/api/admin/blacklist', '/api/developer/keys',
                 '/api/feedback', '/api/reports']:
        status, _, body, _ = http(base + path)
        if status in (401, 403):
            R.ok(f'Protected route rejects no token', path)
        elif status == 200:
            R.fail(f'Protected route accessible without token!', path)
        else:
            R.info_print(f'{path} → {status}')

    # Invalid token formats
    bad_tokens = [
        ('empty string', ''),
        ('spaces only', '   '),
        ('just Bearer', 'Bearer'),
        ('invalid JWT', 'Bearer eyJhbGciOiJIUzI1NiJ9.invalid.sig'),
        ('SQL injection token', "Bearer ' OR '1'='1"),
        ('null bytes', 'Bearer \x00\x00\x00'),
        ('very long token', 'Bearer ' + 'A' * 10000),
        ('unicode token', 'Bearer 🔥💀🚨'),
    ]
    for label, token in bad_tokens:
        status, _, body, _ = http(base + '/api/developer/keys', headers={'Authorization': token})
        if status in (401, 403):
            R.ok(f'Rejects {label}')
        elif status == 200:
            R.fail(f'Accepts {label}!', 'Auth bypass!')
        else:
            R.info_print(f'{label} → {status}')

    # JWT manipulation
    fake_payloads = [
        ('alg:none', 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0.'),
        ('empty sig', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.'),
    ]
    for label, token in fake_payloads:
        status, _, _, _ = http(base + '/api/developer/keys', headers={'Authorization': f'Bearer {token}'})
        if status in (401, 403): R.ok(f'JWT {label} rejected')
        elif status == 200:      R.fail(f'JWT {label} accepted!', 'Critical auth bypass!')
        else:                    R.info_print(f'JWT {label} → {status}')

# ════════════════════════════════════════════════════════════════
# 4. RATE LIMITING TESTS
# ════════════════════════════════════════════════════════════════

def test_rate_limiting(base):
    print(bold('\n⚡ 4. Rate Limiting Tests'))

    # Auth rate limit
    print(f'  {dim("Testing login rate limit (10 requests)...")}')
    results_429 = []
    for i in range(12):
        status, _, _, _ = http(base + '/api/auth/login', 'POST', {
            'email': f'test{i}@test.com', 'password': 'wrongpass', 'turnstileToken': 'test'
        }, timeout=5)
        results_429.append(status)
        if status == 429: break
        time.sleep(0.1)

    if 429 in results_429:
        R.ok('Login rate limit working', f'429 after {results_429.index(429)+1} requests')
    else:
        R.warn('Login rate limit not triggered in 12 requests')

    # Register rate limit
    print(f'  {dim("Testing register rate limit (5 requests)...")}')
    reg_results = []
    for i in range(6):
        status, _, _, _ = http(base + '/api/auth/register', 'POST', {
            'email': f'test{rand_str()}@test.com', 'password': 'Test123456!', 'fullName': 'Test', 'turnstileToken': 'test'
        }, timeout=5)
        reg_results.append(status)
        if status == 429: break
        time.sleep(0.2)

    if 429 in reg_results:
        R.ok('Register rate limit working', f'429 after {reg_results.index(429)+1} requests')
    else:
        R.warn('Register rate limit not triggered in 6 requests')

    # Global rate limit — concurrent requests
    print(f'  {dim("Testing global rate limit (25 concurrent)...")}')
    statuses = []
    with ThreadPoolExecutor(max_workers=25) as ex:
        futures = [ex.submit(http, base + '/health', 'GET', None, None, 5) for _ in range(25)]
        for f in as_completed(futures):
            status, _, _, _ = f.result()
            statuses.append(status)

    hit_429  = statuses.count(429)
    hit_200  = statuses.count(200)
    R.info_print(f'25 concurrent → {hit_200} OK, {hit_429} rate limited')

    # Search rate limit
    print(f'  {dim("Testing search rate limit (10 requests)...")}')
    search_429 = False
    for i in range(10):
        status, _, _, _ = http(base + '/api/search/verify-turnstile', 'POST', {'token': 'test'}, timeout=5)
        if status == 429: search_429 = True; break
        time.sleep(0.1)
    if search_429: R.ok('Search rate limit working')
    else:          R.warn('Search rate limit not triggered in 10 requests')

# ════════════════════════════════════════════════════════════════
# 5. INJECTION ATTACKS
# ════════════════════════════════════════════════════════════════

def test_injection(base):
    print(bold('\n💉 5. Injection Attacks'))

    sql_payloads = [
        "' OR '1'='1",
        "' OR '1'='1' --",
        "' UNION SELECT NULL--",
        "' UNION SELECT username,password FROM users--",
        "'; DROP TABLE users;--",
        "1' AND SLEEP(3)--",
        "' AND 1=CONVERT(int,(SELECT TOP 1 name FROM sysobjects))--",
        "admin'--",
        "' OR 1=1#",
        "\" OR \"\"=\"",
        "1 OR 1=1",
    ]

    xss_payloads = [
        '<script>alert(1)</script>',
        '<img src=x onerror=alert(1)>',
        '"><script>alert(1)</script>',
        "javascript:alert(1)",
        '<svg onload=alert(1)>',
        '{{7*7}}',
        '${7*7}',
        '<iframe src="javascript:alert(1)">',
    ]

    ssti_payloads = [
        '{{7*7}}', '${7*7}', '<%= 7*7 %>', '#{7*7}',
        '{{config}}', '{{self.__class__.__mro__}}',
        '{% for x in [].__class__.__base__.__subclasses__() %}',
    ]

    cmd_payloads = [
        '; ls -la', '| whoami', '`whoami`', '$(whoami)',
        '; cat /etc/passwd', '&& id', '|| id',
    ]

    all_payloads = sql_payloads + xss_payloads + ssti_payloads + cmd_payloads

    # Test on login endpoint
    print(f'  {dim("Testing injection on auth endpoints...")}')
    injection_found = False
    for payload in all_payloads[:15]:  # sample
        status, _, body, elapsed = http(base + '/api/auth/login', 'POST', {
            'email': payload, 'password': payload, 'turnstileToken': 'x'
        }, timeout=8)
        # Look for SQL errors
        error_patterns = ['sql', 'syntax error', 'mysql', 'postgresql', 'sqlite',
                         'ora-', 'jdbc', 'stack trace', 'exception', 'error in your sql']
        body_lower = body.lower()
        for pattern in error_patterns:
            if pattern in body_lower:
                R.fail(f'Possible SQL error disclosure', f'Pattern "{pattern}" in response to: {payload[:30]}')
                injection_found = True
                break
        # Timing attack check
        if elapsed > 3000 and 'sleep' in payload.lower():
            R.fail('Possible time-based SQL injection!', f'{elapsed}ms with sleep payload')
            injection_found = True

    if not injection_found:
        R.ok('No SQL/injection errors disclosed in auth endpoint')

    # Test on public check endpoint
    print(f'  {dim("Testing injection on check endpoint...")}')
    for payload in ["' OR '1'='1", "1; DROP TABLE reports;--", '../../../etc/passwd', '%00']:
        status, _, body, _ = http(f'{base}/api/v1/check?number={payload}&type=phone',
                                  headers={'X-API-Key': 'kt_test_invalid_key'})
        if any(p in body.lower() for p in ['sql', 'syntax error', 'exception']):
            R.fail('Injection error in check endpoint', payload[:30])
        else:
            R.ok(f'Check endpoint safe from: {payload[:20]}')

    # NoSQL injection
    print(f'  {dim("Testing NoSQL injection...")}')
    nosql_payloads = [
        {'email': {'$gt': ''}, 'password': {'$gt': ''}, 'turnstileToken': 'x'},
        {'email': {'$ne': None}, 'password': {'$ne': None}, 'turnstileToken': 'x'},
        {'email': {'$regex': '.*'}, 'password': 'x', 'turnstileToken': 'x'},
    ]
    for payload in nosql_payloads:
        status, _, body, _ = http(base + '/api/auth/login', 'POST', payload)
        if status == 200 and 'session' in body:
            R.fail('NoSQL injection bypass!', str(payload)[:50])
        else:
            R.ok('NoSQL injection rejected')

    # Template injection
    print(f'  {dim("Testing SSTI...")}')
    for payload in ssti_payloads[:5]:
        status, _, body, _ = http(base + '/api/auth/login', 'POST', {
            'email': f'test@{payload}.com', 'password': 'x', 'turnstileToken': 'x'
        })
        if '49' in body or '49.0' in body:  # 7*7 = 49
            R.fail('SSTI detected!', f'Template evaluated: {payload}')
        else:
            R.ok(f'SSTI safe: {payload[:20]}')

# ════════════════════════════════════════════════════════════════
# 6. CORS TESTS
# ════════════════════════════════════════════════════════════════

def test_cors(base):
    print(bold('\n🌐 6. CORS Tests'))

    bad_origins = [
        'https://evil.com',
        'https://kawaltransaksi.com.evil.com',
        'https://evil.kawaltransaksi.com',
        'null',
        'http://localhost:9999',
        'https://kawaltransaksi.com.attacker.io',
        '',
    ]

    for origin in bad_origins:
        headers_req = {'Origin': origin} if origin else {}
        status, resp_headers, body, _ = http(base + '/api/auth/login', 'POST',
            {'email': 'x@x.com', 'password': 'x', 'turnstileToken': 'x'},
            headers=headers_req)
        acao = resp_headers.get('Access-Control-Allow-Origin', '')
        acac = resp_headers.get('Access-Control-Allow-Credentials', '')

        if acao == '*':
            R.warn('CORS wildcard (*) — credentials might be exposed', f'Origin: {origin or "(empty)"}')
        elif acao == origin and origin not in ('', 'null') and 'evil' in origin:
            R.fail('CORS reflects evil origin!', f'ACAO: {acao}')
        elif acac == 'true' and acao:
            if 'evil' in (acao or ''):
                R.fail('CORS with credentials to evil origin!', f'ACAO: {acao}')
            else:
                R.ok(f'CORS credentials controlled', f'Origin: {origin or "(empty)"} → {acao or "blocked"}')
        else:
            R.ok(f'CORS blocked', f'Origin: {origin or "(empty)"} → {acao or "no header"}')

    # Preflight check
    status, headers, _, _ = http(base + '/api/auth/login', 'OPTIONS',
        headers={'Origin': 'https://kawaltransaksi.com',
                 'Access-Control-Request-Method': 'POST',
                 'Access-Control-Request-Headers': 'Content-Type,Authorization'})
    if status in (200, 204):
        R.ok('Preflight OPTIONS handled', f'{status}')
    else:
        R.warn('Preflight OPTIONS not handled properly', str(status))

# ════════════════════════════════════════════════════════════════
# 7. INPUT VALIDATION & BOUNDARY TESTS
# ════════════════════════════════════════════════════════════════

def test_input_validation(base):
    print(bold('\n📋 7. Input Validation & Boundary Tests'))

    # Oversized inputs
    print(f'  {dim("Testing oversized inputs...")}')
    oversized = [
        ('email', 'A' * 10000 + '@test.com'),
        ('password', 'A' * 100000),
        ('fullName', 'A' * 50000),
    ]
    for field, value in oversized:
        payload = {'email': 'test@test.com', 'password': 'Test123!', 'fullName': 'Test', 'turnstileToken': 'x'}
        payload[field] = value
        status, _, _, _ = http(base + '/api/auth/register', 'POST', payload, timeout=10)
        if status in (400, 413, 429, 422):
            R.ok(f'Oversized {field} rejected', str(status))
        elif status in (0,):
            R.warn(f'Connection error for oversized {field} (possible crash?)')
        else:
            R.warn(f'Oversized {field} not rejected properly', str(status))

    # Request body size limit
    print(f'  {dim("Testing request size limits...")}')
    large_body = {'data': 'X' * 600000}  # 600KB
    status, _, _, _ = http(base + '/api/auth/login', 'POST', large_body, timeout=10)
    if status == 413: R.ok('Request size limit enforced (413)')
    elif status in (400, 429): R.ok(f'Large request rejected ({status})')
    else: R.warn('Request size limit not enforced', str(status))

    # Type confusion attacks
    print(f'  {dim("Testing type confusion...")}')
    type_payloads = [
        {'email': 12345, 'password': True, 'turnstileToken': ['x']},
        {'email': None, 'password': None, 'turnstileToken': None},
        {'email': ['a@b.com'], 'password': {'$gt': ''}, 'turnstileToken': 'x'},
        {'email': {}, 'password': [], 'turnstileToken': 'x'},
    ]
    for payload in type_payloads:
        status, _, body, _ = http(base + '/api/auth/login', 'POST', payload)
        if status in (400, 422): R.ok('Type confusion rejected', str(payload)[:40])
        elif status == 200 and 'session' in body: R.fail('Type confusion bypass!', str(payload)[:40])
        else: R.info_print(f'Type confusion → {status}')

    # Null bytes & special chars
    print(f'  {dim("Testing special characters...")}')
    special_payloads = [
        'test\x00@test.com',
        'test\r\n@test.com',
        'test%00@test.com',
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
    ]
    for payload in special_payloads:
        status, _, body, _ = http(base + '/api/auth/login', 'POST', {
            'email': payload, 'password': 'x', 'turnstileToken': 'x'
        })
        error_signs = ['error', 'exception', 'stack', 'undefined', 'null reference']
        if any(s in body.lower() for s in error_signs):
            R.warn('Possible error with special chars', payload[:30])
        else:
            R.ok(f'Special chars handled safely', payload[:20])

    # Parameter pollution
    print(f'  {dim("Testing parameter pollution...")}')
    status, _, body, _ = http(f'{base}/api/v1/check?number=123&number=456&type=phone&type=bank',
                              headers={'X-API-Key': 'kt_test_invalid'})
    if status in (400, 401): R.ok('Parameter pollution handled')
    else: R.info_print(f'Parameter pollution → {status}')

# ════════════════════════════════════════════════════════════════
# 8. BUSINESS LOGIC TESTS
# ════════════════════════════════════════════════════════════════

def test_business_logic(base):
    print(bold('\n💼 8. Business Logic Tests'))

    # Negative/zero amounts
    print(f'  {dim("Testing negative/zero values...")}')
    for amount in [-1, -999999, 0, -0.01, 999999999999]:
        status, _, body, _ = http(base + '/api/reports', 'POST', {
            'target_number': '08123456789', 'target_type': 'phone',
            'category': 'test', 'chronology': 'test',
            'loss_amount': amount
        })
        if status in (400, 401, 403):
            R.ok(f'Amount {amount} handled correctly', str(status))
        else:
            R.info_print(f'Amount {amount} → {status}')

    # Race condition simulation
    print(f'  {dim("Testing race condition (10 concurrent same request)...")}')
    results = []
    with ThreadPoolExecutor(max_workers=10) as ex:
        futures = [ex.submit(http, base + '/api/auth/register', 'POST', {
            'email': 'race@test.com', 'password': 'Test123456!',
            'fullName': 'Race Test', 'turnstileToken': 'race_token_same'
        }, None, 5) for _ in range(10)]
        for f in as_completed(futures):
            status, _, _, _ = f.result()
            results.append(status)
    ok_count  = results.count(200)
    if ok_count > 1:
        R.fail(f'Race condition! {ok_count} requests succeeded simultaneously')
    else:
        R.ok('Race condition handled correctly', f'{ok_count} success out of 10')

    # IDOR test — try accessing other user's resources
    print(f'  {dim("Testing IDOR on report endpoints...")}')
    for test_id in ['00000000-0000-0000-0000-000000000001',
                    '11111111-1111-1111-1111-111111111111',
                    'ffffffff-ffff-ffff-ffff-ffffffffffff']:
        status, _, body, _ = http(f'{base}/api/reports/{test_id}')
        if status in (401, 403, 404): R.ok(f'IDOR protected for {test_id[:8]}...', str(status))
        elif status == 200:           R.warn(f'IDOR? Report accessible without auth', test_id)
        else:                         R.info_print(f'IDOR test {test_id[:8]} → {status}')

    # Privilege escalation — try admin endpoint as non-admin
    print(f'  {dim("Testing privilege escalation...")}')
    admin_endpoints = [
        '/api/admin/users', '/api/admin/blacklist',
        '/api/admin/articles', '/api/admin/apikeys',
    ]
    fake_token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4ifQ.fake'
    for ep in admin_endpoints:
        status, _, _, _ = http(base + ep, headers={'Authorization': fake_token})
        if status in (401, 403): R.ok(f'Admin endpoint protected', ep)
        elif status == 200:      R.fail(f'Admin endpoint accessible with fake token!', ep)
        else:                    R.info_print(f'{ep} → {status}')

# ════════════════════════════════════════════════════════════════
# 9. ERROR HANDLING & INFORMATION DISCLOSURE
# ════════════════════════════════════════════════════════════════

def test_info_disclosure(base):
    print(bold('\n🔓 9. Information Disclosure Tests'))

    sensitive_patterns = [
        'stack trace', 'traceback', 'at line', 'exception in',
        'undefined method', 'null pointer', 'segfault',
        'internal server error details', 'database error',
        'supabase', 'postgresql', 'mysql', 'sqlite',
        'secret_key', 'api_key', 'password', 'token',
        '/home/', 'c:\\users', 'c:\\windows',
        '127.0.0.1', '192.168.', '10.0.', 'localhost',
        'node_modules', 'package.json', '.env',
    ]

    test_cases = [
        ('404', base + '/api/nonexistent/endpoint/here'),
        ('Invalid JSON', base + '/api/auth/login'),
        ('Method not allowed', base + '/api/auth/login'),
    ]

    # 404 response
    status, headers, body, _ = http(base + '/api/this/does/not/exist/at/all/404test')
    body_lower = body.lower()
    leaks = [p for p in sensitive_patterns if p in body_lower]
    if leaks:
        R.warn('Info disclosure in 404', f'Found: {", ".join(leaks[:3])}')
    else:
        R.ok('404 response clean — no sensitive info')

    # 500 trigger via malformed content-type
    status, _, body, _ = http(base + '/api/auth/login', 'POST',
        headers={'Content-Type': 'text/plain', 'Authorization': ''},
        body=None)
    body_lower = (body or '').lower()
    leaks = [p for p in sensitive_patterns if p in body_lower]
    if leaks:
        R.warn('Info disclosure on malformed request', f'Found: {", ".join(leaks[:3])}')
    else:
        R.ok('Malformed request handled cleanly')

    # Check if error messages reveal internal paths
    status, _, body, _ = http(base + '/api/auth/login', 'POST', {
        'email': {'$where': 'sleep(1000)'}, 'password': 'x', 'turnstileToken': 'x'
    })
    leaks = [p for p in ['supabase', '/home/', 'c:\\', 'traceback', 'at line'] if p in body.lower()]
    if leaks:
        R.warn('Error reveals internal info', f'Found: {", ".join(leaks)}')
    else:
        R.ok('Error messages sanitized')

    # Version disclosure
    status, headers, body, _ = http(base + '/health')
    version_patterns = ['version', 'v1.0', 'v2.0', 'node/', 'express/', 'hono/']
    header_str = ' '.join(f'{k}: {v}' for k, v in headers.items()).lower()
    for pattern in version_patterns:
        if pattern in header_str:
            R.warn(f'Version disclosed in headers', pattern)

    R.ok('Version headers checked')

# ════════════════════════════════════════════════════════════════
# 10. CSRF & CLICKJACKING
# ════════════════════════════════════════════════════════════════

def test_csrf_clickjacking(base):
    print(bold('\n🎭 10. CSRF & Clickjacking Tests'))

    # CSRF — request tanpa Origin/Referer
    status, _, body, _ = http(base + '/api/auth/login', 'POST', {
        'email': 'test@test.com', 'password': 'wrong', 'turnstileToken': 'x'
    }, headers={'Origin': '', 'Referer': ''})
    # Should still work for API (CSRF via token), just checking
    R.info_print(f'No-origin request → {status}')

    # CSRF — request dari evil origin (state-changing)
    status, _, body, _ = http(base + '/api/auth/login', 'POST', {
        'email': 'test@test.com', 'password': 'wrong', 'turnstileToken': 'x'
    }, headers={'Origin': 'https://evil.com'})
    if status == 403:
        R.ok('CSRF protection via Origin check')
    else:
        R.warn('Request from evil.com not blocked by Origin', f'Status: {status}')

    # Clickjacking — X-Frame-Options
    status, headers, _, _ = http(base + '/health')
    xfo = headers.get('X-Frame-Options', '')
    csp = headers.get('Content-Security-Policy', '')
    if xfo:
        R.ok('X-Frame-Options set', xfo)
    elif 'frame-ancestors' in csp.lower():
        R.ok('CSP frame-ancestors set (clickjacking protected)')
    else:
        R.warn('No clickjacking protection (X-Frame-Options or CSP frame-ancestors)')

# ════════════════════════════════════════════════════════════════
# 11. API KEY SECURITY
# ════════════════════════════════════════════════════════════════

def test_api_key_security(base):
    print(bold('\n🔑 11. API Key Security Tests'))

    # Invalid format keys
    invalid_keys = [
        ('empty', ''),
        ('random string', rand_str(20)),
        ('wrong prefix', 'kx_live_' + rand_str(40)),
        ('short key', 'kt_live_short'),
        ('sql injection', "kt_live_' OR '1'='1"),
        ('too long', 'kt_live_' + 'A' * 1000),
        ('special chars', 'kt_live_<script>alert(1)</script>'),
        ('path traversal', 'kt_live_../../../etc/passwd'),
    ]

    for label, key in invalid_keys:
        status, _, body, _ = http(f'{base}/api/v1/check?number=081234&type=phone',
                                  headers={'X-API-Key': key})
        if status == 401: R.ok(f'Invalid key rejected: {label}')
        elif status == 200: R.fail(f'Invalid key accepted: {label}!', key[:30])
        else: R.info_print(f'{label} → {status}')

    # Key in URL (insecure) vs header
    status_url, _, _, _ = http(f'{base}/api/v1/check?number=081234&type=phone&api_key=kt_test_fake')
    status_hdr, _, _, _ = http(f'{base}/api/v1/check?number=081234&type=phone',
                                headers={'X-API-Key': 'kt_test_fake'})
    R.info_print(f'Key in URL → {status_url}, Key in header → {status_hdr}')
    if status_url == 200: R.warn('API key accepted via URL parameter (insecure — logs may expose key)')
    else:                 R.ok('API key in URL rejected or handled same as header')

    # Brute force protection — many wrong keys
    print(f'  {dim("Testing API key brute force protection (15 attempts)...")}')
    bf_429 = False
    for i in range(15):
        key = 'kt_live_' + rand_str(40)
        status, _, _, _ = http(f'{base}/api/v1/check?number=081234&type=phone',
                               headers={'X-API-Key': key}, timeout=5)
        if status == 429: bf_429 = True; break
        time.sleep(0.05)
    if bf_429: R.ok('API key brute force protection active')
    else:      R.warn('No brute force protection on API key validation in 15 attempts')

# ════════════════════════════════════════════════════════════════
# 12. FILE UPLOAD SECURITY
# ════════════════════════════════════════════════════════════════

def test_file_upload(base):
    print(bold('\n📁 12. File Upload Security Tests'))

    from urllib.request import urlopen, Request
    import io

    # We'll use raw multipart form data
    def make_multipart(filename, content, content_type):
        boundary = 'KWT' + rand_str(16)
        body = (
            f'--{boundary}\r\n'
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
            f'Content-Type: {content_type}\r\n\r\n'
        ).encode() + content + f'\r\n--{boundary}--\r\n'.encode()
        return body, f'multipart/form-data; boundary={boundary}'

    # PHP webshell disguised as image
    php_shell = b'<?php system($_GET["cmd"]); ?>'
    jpeg_header = b'\xFF\xD8\xFF\xE0' + b'\x00' * 16  # JPEG magic bytes

    test_uploads = [
        ('PHP shell', b'<?php system("id"); ?>', 'image/jpeg', 'shell.php'),
        ('PHP in JPEG', jpeg_header + b'<?php system("id"); ?>', 'image/jpeg', 'evil.jpg'),
        ('SVG XSS', b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', 'image/svg+xml', 'evil.svg'),
        ('Double ext', b'\xFF\xD8\xFF\xE0', 'image/jpeg', 'evil.php.jpg'),
        ('Null byte ext', b'\xFF\xD8\xFF\xE0', 'image/jpeg', 'evil.php\x00.jpg'),
        ('Path traversal', b'\xFF\xD8\xFF\xE0', 'image/jpeg', '../../../evil.jpg'),
        ('HTML file', b'<html><body><script>alert(1)</script></body></html>', 'text/html', 'evil.html'),
        ('Huge file', b'A' * (6 * 1024 * 1024 + 1), 'image/jpeg', 'huge.jpg'),  # 6MB+
    ]

    for label, content, ct, filename in test_uploads:
        body, content_type = make_multipart(filename, content, ct)
        try:
            req = Request(
                base + '/api/upload',
                data=body,
                headers={
                    'Content-Type': content_type,
                    'Authorization': 'Bearer invalid_token_test',
                    'Content-Length': str(len(body)),
                },
                method='POST'
            )
            with urlopen(req, timeout=10) as resp:
                status = resp.status
                rbody  = resp.read().decode('utf-8', errors='replace')
        except HTTPError as e:
            status = e.code
            try: rbody = e.read().decode('utf-8', errors='replace')
            except: rbody = ''
        except: status, rbody = 0, ''

        if status == 401:
            R.ok(f'Upload auth protected: {label}')
        elif status in (400, 413, 415, 422):
            R.ok(f'Upload rejected: {label}', str(status))
        elif status == 200 and 'url' in rbody:
            R.fail(f'Dangerous file uploaded: {label}!', filename)
        else:
            R.info_print(f'{label} → {status}')

# ════════════════════════════════════════════════════════════════
# 13. HONEYPOT TESTS
# ════════════════════════════════════════════════════════════════

def test_honeypot(base):
    print(bold('\n🍯 13. Honeypot Tests'))

    honeypot_paths = [
        '/api/v1/accounts', '/api/v1/reports', '/api/v1/keys',
        '/api/v1/token', '/api/v1/users', '/api/v1/admin',
        '/api/internal',
    ]

    for path in honeypot_paths:
        for method in ['GET', 'POST']:
            status, _, body, _ = http(base + path, method, timeout=5)
            if status == 404:
                R.ok(f'Honeypot returns 404: {path} ({method})')
            elif status == 403:
                R.ok(f'Honeypot returns 403: {path} ({method})')
            else:
                R.warn(f'Honeypot unexpected response: {path}', str(status))

# ════════════════════════════════════════════════════════════════
# 14. TIMING ATTACKS
# ════════════════════════════════════════════════════════════════

def test_timing(base):
    print(bold('\n⏱️  14. Timing Attack Tests'))

    # User enumeration via timing
    print(f'  {dim("Testing user enumeration via timing (5 samples each)...")}')

    def avg_time(url, body, n=5):
        times = []
        for _ in range(n):
            _, _, _, elapsed = http(url, 'POST', body, timeout=10)
            if elapsed > 0: times.append(elapsed)
            time.sleep(0.1)
        return sum(times) / len(times) if times else 0

    # Compare existing vs non-existing email response time
    existing_time    = avg_time(base + '/api/auth/login', {'email': 'admin@kawaltransaksi.com', 'password': 'wrong', 'turnstileToken': 'x'})
    nonexisting_time = avg_time(base + '/api/auth/login', {'email': f'{rand_str(20)}@{rand_str(10)}.com', 'password': 'wrong', 'turnstileToken': 'x'})

    diff = abs(existing_time - nonexisting_time)
    R.info_print(f'Existing email avg: {existing_time:.0f}ms, Non-existing: {nonexisting_time:.0f}ms, Diff: {diff:.0f}ms')

    if diff > 500:
        R.warn('Large timing difference — possible user enumeration', f'{diff:.0f}ms difference')
    else:
        R.ok('Timing difference acceptable', f'{diff:.0f}ms')

    # API key validation timing
    valid_format_time    = avg_time(base + '/api/v1/check?number=081&type=phone', {}, n=3) # uses GET with header
    invalid_format_time  = avg_time(base + '/api/v1/check?number=081&type=phone', {}, n=3)
    R.info_print(f'API endpoint response time: ~{valid_format_time:.0f}ms')

# ════════════════════════════════════════════════════════════════
# 15. OPEN REDIRECT TESTS
# ════════════════════════════════════════════════════════════════

def test_open_redirect(base):
    print(bold('\n↪️  15. Open Redirect Tests'))

    evil_urls = [
        'https://evil.com',
        '//evil.com',
        '///evil.com',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        '\\evil.com',
        'https://kawaltransaksi.com@evil.com',
        '%2F%2Fevil.com',
    ]

    redirect_params = ['redirect', 'redirect_uri', 'return', 'returnUrl',
                      'next', 'url', 'to', 'dest', 'destination', 'r']

    found_redirect = False
    for param in redirect_params:
        for evil_url in evil_urls[:3]:
            status, headers, _, _ = http(f'{base}/api/auth/login?{param}={evil_url}')
            location = headers.get('Location', '')
            if location and any(e in location for e in ['evil.com', 'javascript:']):
                R.fail(f'Open redirect via {param}!', f'→ {location}')
                found_redirect = True
            elif status in (301, 302, 307, 308) and location:
                R.warn(f'Redirect found via {param}', f'→ {location[:50]}')

    if not found_redirect:
        R.ok('No open redirect vulnerabilities found')

# ════════════════════════════════════════════════════════════════
# 16. CONTENT-TYPE & ACCEPT HEADER TESTS
# ════════════════════════════════════════════════════════════════

def test_content_type(base):
    print(bold('\n📄 16. Content-Type Tests'))

    # XML/text content type confusion
    weird_content_types = [
        ('application/xml', b'<?xml version="1.0"?><root><email>x@x.com</email></root>'),
        ('text/plain', b'email=x@x.com&password=x'),
        ('application/x-www-form-urlencoded', b'email=x%40x.com&password=x'),
        ('multipart/form-data', b'email=x@x.com'),
        ('text/html', b'<html>test</html>'),
    ]

    for ct, body in weird_content_types:
        try:
            req = Request(base + '/api/auth/login', data=body,
                        headers={'Content-Type': ct}, method='POST')
            with urlopen(req, timeout=5) as resp:
                status = resp.status
        except HTTPError as e:
            status = e.code
        except: status = 0

        if status in (400, 415, 422):
            R.ok(f'Content-Type {ct} properly rejected', str(status))
        elif status in (401, 429):
            R.ok(f'Content-Type {ct} handled (auth check)', str(status))
        else:
            R.info_print(f'Content-Type {ct} → {status}')

# ════════════════════════════════════════════════════════════════
# 17. IDEMPOTENCY & REPLAY ATTACK
# ════════════════════════════════════════════════════════════════

def test_replay_attack(base):
    print(bold('\n🔄 17. Replay Attack & Idempotency Tests'))

    # Same idempotency key — should return same response
    idem_key = f'test-idem-{rand_str(16)}'
    r1_status, _, r1_body, _ = http(
        f'{base}/api/v1/check?number=081234567890&type=phone',
        headers={'X-API-Key': 'kt_test_invalid', 'Idempotency-Key': idem_key}
    )
    r2_status, _, r2_body, _ = http(
        f'{base}/api/v1/check?number=081234567890&type=phone',
        headers={'X-API-Key': 'kt_test_invalid', 'Idempotency-Key': idem_key}
    )

    R.info_print(f'Same Idempotency-Key: r1={r1_status}, r2={r2_status}')

    # Turnstile token replay
    print(f'  {dim("Testing Turnstile token replay...")}')
    fake_token = f'fake_turnstile_{rand_str(20)}'
    status1, _, _, _ = http(base + '/api/auth/login', 'POST', {
        'email': 'x@x.com', 'password': 'x', 'turnstileToken': fake_token
    })
    status2, _, _, _ = http(base + '/api/auth/login', 'POST', {
        'email': 'x@x.com', 'password': 'x', 'turnstileToken': fake_token
    })

    if status1 == status2 and status2 in (400, 401):
        R.ok('Turnstile token same-response (replay handled)', f'{status1} → {status2}')
    elif status1 != status2:
        R.info_print(f'Turnstile replay responses differ: {status1} → {status2}')
    else:
        R.info_print(f'Turnstile replay: {status1} → {status2}')

# ════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description='KawalTransaksi Security Test Suite')
    parser.add_argument('--url', default='http://localhost:8787', help='Base API URL')
    parser.add_argument('--verbose', action='store_true', help='Verbose output')
    parser.add_argument('--skip', nargs='+', help='Skip test numbers e.g. --skip 6 14')
    args = parser.parse_args()

    base = args.url.rstrip('/')
    skip = set(args.skip or [])

    print(bold('\n🔒 KawalTransaksi Security Test Suite'))
    print(bold('17 Test Categories: Recon · Auth · Rate Limit · Injection · CORS · Business Logic · More'))
    print(f'Target: {cyan(base)}')
    print('=' * 70)

    # Check if target is reachable
    print(f'\n{dim("Checking target reachability...")}')
    status, _, _, elapsed = http(base + '/health', timeout=5)
    if status == 0:
        print(red(f'\n❌ Target not reachable: {base}'))
        print(dim('Make sure the server is running and URL is correct.'))
        sys.exit(1)
    print(f'{green("✅")} Target reachable — {status} in {elapsed}ms\n')

    tests = [
        ('1', test_recon),
        ('2', test_security_headers),
        ('3', test_authentication),
        ('4', test_rate_limiting),
        ('5', test_injection),
        ('6', test_cors),
        ('7', test_input_validation),
        ('8', test_business_logic),
        ('9', test_info_disclosure),
        ('10', test_csrf_clickjacking),
        ('11', test_api_key_security),
        ('12', test_file_upload),
        ('13', test_honeypot),
        ('14', test_timing),
        ('15', test_open_redirect),
        ('16', test_content_type),
        ('17', test_replay_attack),
    ]

    t_start = time.time()
    for num, fn in tests:
        if num in skip:
            print(f'\n{dim(f"⏭️  Skipping test {num}")}')
            continue
        try:
            fn(base)
        except KeyboardInterrupt:
            print(yellow('\n⚠️  Interrupted by user'))
            break
        except Exception as e:
            print(red(f'\n❌ Test {num} crashed: {e}'))

    elapsed_total = int(time.time() - t_start)

    # Summary
    print('\n' + '=' * 70)
    print(bold('📊 Security Test Summary'))
    print(f'  Duration : {elapsed_total}s')
    print(f'  Passed   : {green(str(len(R.passed)))}')
    print(f'  Failed   : {red(str(len(R.failed))) if R.failed else green("0")}')
    print(f'  Warnings : {yellow(str(len(R.info)))}')

    if R.failed:
        print(f'\n{bold(red("❌ VULNERABILITIES FOUND:"))}')
        for label, detail in R.failed:
            print(f'  {red("→")} {label}' + (f': {detail}' if detail else ''))

    if not R.failed:
        print(f'\n{green("✅ No critical vulnerabilities found!")}')
        if R.info:
            print(f'{yellow("⚠️  Some warnings to review above.")}')

    print(f'\n{dim("💡 For deeper testing, complement with: nuclei, sqlmap, burp suite, ffuf")}')
    print()
    return 1 if R.failed else 0

if __name__ == '__main__':
    sys.exit(main())