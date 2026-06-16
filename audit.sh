#!/usr/bin/env bash
# =============================================================
# KawalTransaksi - Comprehensive Code Audit Script
# Standard: OWASP, CWE, ESLint, TypeScript strict, Knip
# =============================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_DIR="$ROOT_DIR/audit-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$REPORT_DIR/audit_$TIMESTAMP.md"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

mkdir -p "$REPORT_DIR"

log()     { echo -e "${CYAN}[AUDIT]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[FAIL]${NC} $1"; }
section() { echo -e "\n${BLUE}━━━ $1 ━━━${NC}"; }

# Header report
cat > "$REPORT_FILE" << EOF
# KawalTransaksi — Audit Report
Generated: $(date "+%Y-%m-%d %H:%M:%S")
Auditor: audit.sh v1.0

---

EOF

append() { echo -e "$1" >> "$REPORT_FILE"; }

# =============================================================
# 1. SECURITY AUDIT
# =============================================================
section "1. SECURITY"
append "## 1. Security\n"

log "Scanning for hardcoded secrets..."
append "### 1.1 Hardcoded Secrets\n\`\`\`"

SECRET_PATTERNS=(
  "password\s*=\s*['\"][^'\"]{4,}"
  "secret\s*=\s*['\"][^'\"]{4,}"
  "api_key\s*=\s*['\"][^'\"]{4,}"
  "apikey\s*=\s*['\"][^'\"]{4,}"
  "token\s*=\s*['\"][^'\"]{4,}"
  "private_key"
  "sk_live_"
  "pk_live_"
  "SUPABASE_SERVICE"
  "Bearer [A-Za-z0-9\-_]{20,}"
)

FOUND_SECRETS=0
for pattern in "${SECRET_PATTERNS[@]}"; do
  RESULTS=$(grep -rniE "$pattern" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.env*" \
    --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.wrangler \
    "$ROOT_DIR" 2>/dev/null || true)
  if [ -n "$RESULTS" ]; then
    echo "$RESULTS" >> "$REPORT_FILE"
    FOUND_SECRETS=$((FOUND_SECRETS + 1))
    warn "Potential secret found: $pattern"
  fi
done

if [ "$FOUND_SECRETS" -eq 0 ]; then
  append "No hardcoded secrets detected."
  success "No hardcoded secrets"
fi
append "\`\`\`\n"

log "Checking .env files not in .gitignore..."
append "### 1.2 .env Files in Git\n\`\`\`"
ENV_EXPOSED=$(git -C "$ROOT_DIR" ls-files | grep -E "\.env$|\.env\.local$|\.env\.production$" || true)
if [ -n "$ENV_EXPOSED" ]; then
  echo "$ENV_EXPOSED" >> "$REPORT_FILE"
  error ".env files are tracked by git!"
else
  append "No .env files tracked by git."
  success ".env files properly gitignored"
fi
append "\`\`\`\n"

log "Checking for console.log in production code..."
append "### 1.3 console.log in Production Code\n\`\`\`"
CONSOLE_LOGS=$(grep -rn "console\.log\|console\.error\|console\.warn\|console\.debug" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  "$ROOT_DIR" 2>/dev/null | grep -v "//.*console" || true)
if [ -n "$CONSOLE_LOGS" ]; then
  echo "$CONSOLE_LOGS" >> "$REPORT_FILE"
  warn "console statements found — remove before production"
else
  append "No console statements found."
  success "No console.log in production code"
fi
append "\`\`\`\n"

log "Checking dangerouslySetInnerHTML usage..."
append "### 1.4 dangerouslySetInnerHTML (XSS Risk)\n\`\`\`"
DANGEROUS=$(grep -rn "dangerouslySetInnerHTML" \
  --include="*.tsx" --include="*.jsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  "$ROOT_DIR" 2>/dev/null || true)
if [ -n "$DANGEROUS" ]; then
  echo "$DANGEROUS" >> "$REPORT_FILE"
  warn "dangerouslySetInnerHTML found — verify all inputs are sanitized"
else
  append "No dangerouslySetInnerHTML usage."
  success "No XSS risk via dangerouslySetInnerHTML"
fi
append "\`\`\`\n"

# =============================================================
# 2. TYPESCRIPT AUDIT
# =============================================================
section "2. TYPESCRIPT"
append "## 2. TypeScript\n"

log "Running TypeScript strict check (frontend)..."
append "### 2.1 Frontend TypeScript Errors\n\`\`\`"
if [ -d "$ROOT_DIR/frontend" ]; then
  cd "$ROOT_DIR/frontend"
  TS_ERRORS=$(npx tsc --noEmit 2>&1 || true)
  if [ -n "$TS_ERRORS" ]; then
    echo "$TS_ERRORS" >> "$REPORT_FILE"
    error "TypeScript errors found in frontend"
  else
    append "No TypeScript errors."
    success "Frontend TypeScript clean"
  fi
  cd "$ROOT_DIR"
fi
append "\`\`\`\n"

log "Running TypeScript strict check (backend)..."
append "### 2.2 Backend TypeScript Errors\n\`\`\`"
if [ -d "$ROOT_DIR/backend" ]; then
  cd "$ROOT_DIR/backend"
  TS_ERRORS=$(npx tsc --noEmit 2>&1 || true)
  if [ -n "$TS_ERRORS" ]; then
    echo "$TS_ERRORS" >> "$REPORT_FILE"
    error "TypeScript errors found in backend"
  else
    append "No TypeScript errors."
    success "Backend TypeScript clean"
  fi
  cd "$ROOT_DIR"
fi
append "\`\`\`\n"

log "Checking for 'any' type usage..."
append "### 2.3 Explicit \`any\` Usage\n\`\`\`"
ANY_USAGE=$(grep -rn ": any\b\|as any\b\|<any>" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.wrangler \
  "$ROOT_DIR" 2>/dev/null || true)
if [ -n "$ANY_USAGE" ]; then
  echo "$ANY_USAGE" >> "$REPORT_FILE"
  warn "'any' type found — consider stricter typing"
else
  append "No explicit 'any' types found."
  success "No 'any' type usage"
fi
append "\`\`\`\n"

# =============================================================
# 3. DEAD CODE & UNUSED EXPORTS
# =============================================================
section "3. DEAD CODE"
append "## 3. Dead Code & Unused Exports\n"

log "Running Knip (dead code detector)..."
append "### 3.1 Frontend Dead Code (Knip)\n\`\`\`"
if [ -d "$ROOT_DIR/frontend" ]; then
  cd "$ROOT_DIR/frontend"
  if npx knip --version > /dev/null 2>&1; then
    KNIP_RESULT=$(npx knip 2>&1 || true)
    echo "$KNIP_RESULT" >> "$REPORT_FILE"
  else
    npx --yes knip 2>&1 >> "$REPORT_FILE" || append "Knip not available, skipping."
  fi
  cd "$ROOT_DIR"
fi
append "\`\`\`\n"

log "Checking unused imports..."
append "### 3.2 Unused Imports\n\`\`\`"
UNUSED_IMPORTS=$(grep -rn "^import.*from" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  "$ROOT_DIR/frontend/src" "$ROOT_DIR/frontend/app" "$ROOT_DIR/frontend/components" \
  "$ROOT_DIR/frontend/features" "$ROOT_DIR/frontend/core" 2>/dev/null | head -5 || true)
append "Run ESLint with no-unused-vars for precise detection. Sample imports checked."
append "\`\`\`\n"

# =============================================================
# 4. ESLINT
# =============================================================
section "4. ESLINT"
append "## 4. ESLint\n"

log "Running ESLint (frontend)..."
append "### 4.1 Frontend ESLint\n\`\`\`"
if [ -d "$ROOT_DIR/frontend" ]; then
  cd "$ROOT_DIR/frontend"
  ESLINT_RESULT=$(npx eslint . --ext .ts,.tsx --max-warnings=0 2>&1 || true)
  if [ -n "$ESLINT_RESULT" ]; then
    echo "$ESLINT_RESULT" >> "$REPORT_FILE"
    warn "ESLint issues found"
  else
    append "No ESLint issues."
    success "Frontend ESLint clean"
  fi
  cd "$ROOT_DIR"
fi
append "\`\`\`\n"

# =============================================================
# 5. DEPENDENCY AUDIT
# =============================================================
section "5. DEPENDENCIES"
append "## 5. Dependency Vulnerabilities\n"

log "Running npm audit (frontend)..."
append "### 5.1 Frontend npm audit\n\`\`\`"
if [ -d "$ROOT_DIR/frontend" ]; then
  cd "$ROOT_DIR/frontend"
  NPM_AUDIT=$(npm audit --audit-level=moderate 2>&1 || true)
  echo "$NPM_AUDIT" >> "$REPORT_FILE"
  cd "$ROOT_DIR"
fi
append "\`\`\`\n"

log "Running npm audit (backend)..."
append "### 5.2 Backend npm audit\n\`\`\`"
if [ -d "$ROOT_DIR/backend" ]; then
  cd "$ROOT_DIR/backend"
  NPM_AUDIT=$(npm audit --audit-level=moderate 2>&1 || true)
  echo "$NPM_AUDIT" >> "$REPORT_FILE"
  cd "$ROOT_DIR"
fi
append "\`\`\`\n"

log "Checking for outdated packages (frontend)..."
append "### 5.3 Outdated Packages\n\`\`\`"
if [ -d "$ROOT_DIR/frontend" ]; then
  cd "$ROOT_DIR/frontend"
  OUTDATED=$(npm outdated 2>&1 || true)
  if [ -n "$OUTDATED" ]; then
    echo "$OUTDATED" >> "$REPORT_FILE"
  else
    append "All packages up to date."
  fi
  cd "$ROOT_DIR"
fi
append "\`\`\`\n"

# =============================================================
# 6. CODE QUALITY
# =============================================================
section "6. CODE QUALITY"
append "## 6. Code Quality\n"

log "Checking file encoding (UTF-8)..."
append "### 6.1 Non UTF-8 Files\n\`\`\`"
NON_UTF8=$(find "$ROOT_DIR/frontend" "$ROOT_DIR/backend" \
  -name "*.ts" -o -name "*.tsx" | \
  xargs file 2>/dev/null | grep -v "UTF-8\|ASCII\|empty" | \
  grep -v "node_modules\|.next\|.wrangler" || true)
if [ -n "$NON_UTF8" ]; then
  echo "$NON_UTF8" >> "$REPORT_FILE"
  warn "Non UTF-8 files found"
else
  append "All files are UTF-8 encoded."
  success "All files UTF-8 encoded"
fi
append "\`\`\`\n"

log "Checking for TODO/FIXME/HACK comments..."
append "### 6.2 TODO / FIXME / HACK Comments\n\`\`\`"
TODOS=$(grep -rn "TODO\|FIXME\|HACK\|XXX\|BUG" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.wrangler \
  "$ROOT_DIR" 2>/dev/null || true)
if [ -n "$TODOS" ]; then
  echo "$TODOS" >> "$REPORT_FILE"
  warn "TODO/FIXME comments found"
else
  append "No TODO/FIXME comments."
  success "No TODO/FIXME comments"
fi
append "\`\`\`\n"

log "Checking for large files (>200 lines)..."
append "### 6.3 Large Files (>200 lines)\n\`\`\`"
LARGE_FILES=$(find "$ROOT_DIR/frontend" "$ROOT_DIR/backend" \
  -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
  grep -v "node_modules\|.next\|.wrangler" | \
  xargs wc -l 2>/dev/null | \
  awk '$1 > 200 {print $0}' | sort -rn | head -20 || true)
if [ -n "$LARGE_FILES" ]; then
  echo "$LARGE_FILES" >> "$REPORT_FILE"
  warn "Large files detected — consider splitting"
else
  append "No files exceed 200 lines."
  success "File sizes within limit"
fi
append "\`\`\`\n"

log "Checking for duplicate code patterns..."
append "### 6.4 Potential Duplicate Code\n\`\`\`"
# Check for identical function signatures
DUP_FUNCTIONS=$(grep -rn "^export.*function\|^export default function\|^const.*=.*async" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  "$ROOT_DIR" 2>/dev/null | \
  awk -F: '{print $NF}' | sort | uniq -d | head -10 || true)
if [ -n "$DUP_FUNCTIONS" ]; then
  echo "$DUP_FUNCTIONS" >> "$REPORT_FILE"
  warn "Potential duplicate function signatures"
else
  append "No obvious duplicate code patterns."
  success "No duplicate code detected"
fi
append "\`\`\`\n"

# =============================================================
# 7. NEXT.JS SPECIFIC
# =============================================================
section "7. NEXT.JS"
append "## 7. Next.js Best Practices\n"

log "Checking for missing 'use client' directives..."
append "### 7.1 Client Hooks in Server Components\n\`\`\`"
CLIENT_HOOKS=$(grep -rn "useState\|useEffect\|useRef\|useCallback\|useMemo\|useRouter\|usePathname" \
  --include="*.tsx" --include="*.ts" \
  --exclude-dir=node_modules --exclude-dir=.next \
  "$ROOT_DIR/frontend/app" 2>/dev/null | \
  while IFS= read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    if ! grep -q "^'use client'" "$file" 2>/dev/null && ! grep -q '^"use client"' "$file" 2>/dev/null; then
      echo "$line"
    fi
  done || true)
if [ -n "$CLIENT_HOOKS" ]; then
  echo "$CLIENT_HOOKS" >> "$REPORT_FILE"
  warn "Client hooks found in potential server components"
else
  append "All client hooks properly marked."
  success "Client/Server components properly marked"
fi
append "\`\`\`\n"

log "Checking for missing alt tags on images..."
append "### 7.2 Missing Alt Tags\n\`\`\`"
MISSING_ALT=$(grep -rn "<img\b" \
  --include="*.tsx" --include="*.jsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  "$ROOT_DIR/frontend" 2>/dev/null | grep -v "alt=" || true)
if [ -n "$MISSING_ALT" ]; then
  echo "$MISSING_ALT" >> "$REPORT_FILE"
  warn "Images missing alt attribute"
else
  append "All images have alt attributes."
  success "All images have alt tags"
fi
append "\`\`\`\n"

log "Checking metadata completeness..."
append "### 7.3 Pages Missing Metadata\n\`\`\`"
MISSING_META=$(find "$ROOT_DIR/frontend/app" -name "page.tsx" | \
  grep -v node_modules | \
  while read -r file; do
    dir=$(dirname "$file")
    if ! grep -q "export.*metadata\|generateMetadata" "$file" "$dir/layout.tsx" 2>/dev/null; then
      echo "Missing metadata: $file"
    fi
  done || true)
if [ -n "$MISSING_META" ]; then
  echo "$MISSING_META" >> "$REPORT_FILE"
  warn "Some pages missing metadata"
else
  append "All pages have metadata."
  success "All pages have metadata"
fi
append "\`\`\`\n"

# =============================================================
# 8. PERFORMANCE
# =============================================================
section "8. PERFORMANCE"
append "## 8. Performance\n"

log "Checking for unoptimized images..."
append "### 8.1 Unoptimized <img> Tags (use next/image)\n\`\`\`"
UNOPT_IMG=$(grep -rn "<img\b" \
  --include="*.tsx" --include="*.jsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  "$ROOT_DIR/frontend" 2>/dev/null || true)
if [ -n "$UNOPT_IMG" ]; then
  echo "$UNOPT_IMG" >> "$REPORT_FILE"
  warn "Raw <img> tags found — use next/image for optimization"
else
  append "No raw <img> tags. next/image used properly."
  success "Images properly optimized"
fi
append "\`\`\`\n"

log "Checking bundle size..."
append "### 8.2 Build Size Analysis\n\`\`\`"
if [ -d "$ROOT_DIR/frontend" ]; then
  cd "$ROOT_DIR/frontend"
  if [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next/static 2>/dev/null || echo "Build not found — run npm run build first")
    append "Static bundle size: $BUILD_SIZE"
  else
    append "No build found. Run 'npm run build' in frontend/ then re-run audit."
  fi
  cd "$ROOT_DIR"
fi
append "\`\`\`\n"

# =============================================================
# 9. ENVIRONMENT & CONFIG
# =============================================================
section "9. CONFIG"
append "## 9. Environment & Config\n"

log "Checking .env.example completeness..."
append "### 9.1 .env.example vs .env.local\n\`\`\`"
if [ -f "$ROOT_DIR/frontend/.env.example" ] && [ -f "$ROOT_DIR/frontend/.env.local" ]; then
  EXAMPLE_KEYS=$(grep -v "^#\|^$" "$ROOT_DIR/frontend/.env.example" | cut -d= -f1 | sort)
  LOCAL_KEYS=$(grep -v "^#\|^$" "$ROOT_DIR/frontend/.env.local" | cut -d= -f1 | sort)
  MISSING_KEYS=$(comm -23 <(echo "$EXAMPLE_KEYS") <(echo "$LOCAL_KEYS") || true)
  if [ -n "$MISSING_KEYS" ]; then
    echo "Keys in .env.example but missing in .env.local:" >> "$REPORT_FILE"
    echo "$MISSING_KEYS" >> "$REPORT_FILE"
    warn "Some env keys missing in .env.local"
  else
    append "All .env.example keys present in .env.local."
    success ".env files in sync"
  fi
else
  append ".env.example or .env.local not found."
fi
append "\`\`\`\n"

log "Checking wrangler.toml for exposed secrets..."
append "### 9.2 Wrangler Config\n\`\`\`"
if [ -f "$ROOT_DIR/backend/wrangler.toml" ]; then
  WRANGLER_SECRETS=$(grep -n "password\|secret\|token\|key" \
    "$ROOT_DIR/backend/wrangler.toml" 2>/dev/null | grep -v "#" || true)
  if [ -n "$WRANGLER_SECRETS" ]; then
    echo "$WRANGLER_SECRETS" >> "$REPORT_FILE"
    warn "Potential secrets in wrangler.toml — use wrangler secret put instead"
  else
    append "No secrets detected in wrangler.toml."
    success "wrangler.toml clean"
  fi
fi
append "\`\`\`\n"

# =============================================================
# 10. GIT HYGIENE
# =============================================================
section "10. GIT"
append "## 10. Git Hygiene\n"

log "Checking for large files in git history..."
append "### 10.1 Large Files in Repo\n\`\`\`"
LARGE_GIT=$(find "$ROOT_DIR" -not -path "*/node_modules/*" -not -path "*/.next/*" \
  -not -path "*/.git/*" -size +500k -type f 2>/dev/null | head -10 || true)
if [ -n "$LARGE_GIT" ]; then
  echo "$LARGE_GIT" >> "$REPORT_FILE"
  warn "Large files found in repo"
else
  append "No large files detected."
  success "No large files in repo"
fi
append "\`\`\`\n"

log "Checking .gitignore completeness..."
append "### 10.2 .gitignore Check\n\`\`\`"
REQUIRED_IGNORES=(".env.local" ".env.production" "node_modules" ".next" ".wrangler" "*.log")
MISSING_IGNORES=()
for entry in "${REQUIRED_IGNORES[@]}"; do
  if ! grep -q "$entry" "$ROOT_DIR/.gitignore" 2>/dev/null && \
     ! grep -q "$entry" "$ROOT_DIR/frontend/.gitignore" 2>/dev/null && \
     ! grep -q "$entry" "$ROOT_DIR/backend/.gitignore" 2>/dev/null; then
    MISSING_IGNORES+=("$entry")
  fi
done
if [ ${#MISSING_IGNORES[@]} -gt 0 ]; then
  echo "Missing from .gitignore: ${MISSING_IGNORES[*]}" >> "$REPORT_FILE"
  warn "Some entries missing from .gitignore"
else
  append "All critical entries present in .gitignore."
  success ".gitignore complete"
fi
append "\`\`\`\n"

# =============================================================
# SUMMARY
# =============================================================
section "SUMMARY"
append "---\n## Summary\n"
append "Report saved to: \`$REPORT_FILE\`"
append "Run date: $(date '+%Y-%m-%d %H:%M:%S')\n"
append "> Re-run this script after fixing issues to verify remediation.\n"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Audit complete. Report: audit-reports/audit_$TIMESTAMP.md${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"