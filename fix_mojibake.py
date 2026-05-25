import os
import sys

DRY_RUN = '--dry-run' in sys.argv

REPLACEMENTS = {
    # Mojibake -> unicode benar -> ASCII
    'ÔöÇ': '-', 'ÔÇö': '--', 'ÔÇô': '-', 'ÔÇó': '-',
    'ÔåÆ': '->', 'ÔåÉ': '^', 'ÔåÈ': 'v', 'ÔåÇ': '<->',
    'Ô£à': '[OK]', 'Ô£ö': '[X]', 'ÔØî': '[X]', 'Ô£ô': '[OK]',
    'ÔÜá': '[!]', 'ÔÜí': '[!]', 'ÔÜî': '[X]',
    'ƒôü': '', 'ƒöÑ': '', 'ƒôØ': '', 'ƒÅª': '',
    'ƒÜö': '', 'ƒô▒': '', 'ƒæï': '', 'ƒöä': '',
    '┬®': '(c)', '┬À': '-', '├ù': 'x', '´©Å': '',
    '´╗┐': '', '┬¡': '',
# Sisa yang belum ter-replace
    '✅': '[OK]', '❌': '[X]', '←': '<-',
    '⏳': '[...]', '🧪': '', '🛑': '[STOP]',
    '█': '#', '🚔': '', '📁': '', '📝': '',
    '\xad': '', '\ufeff': '',
}

EXTENSIONS = ('.tsx', '.ts', '.js', '.jsx', '.css', '.json', '.md', '.toml')
SKIP_DIRS = {'node_modules', '.next', '.wrangler', '.git', '__pycache__'}

files = []
for root, dirs, filenames in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    for f in filenames:
        if f.endswith(EXTENSIONS):
            files.append(os.path.join(root, f))

print(f"{'[DRY RUN] ' if DRY_RUN else ''}Scanning {len(files)} files...\n")

fixed_count = 0
for fp in sorted(files):
    with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
        original = f.read()

    fixed = original
    for bad, good in REPLACEMENTS.items():
        fixed = fixed.replace(bad, good)

    if fixed != original:
        print(f"  {'[WOULD FIX]' if DRY_RUN else 'FIXED'}: {fp}")
        if not DRY_RUN:
            with open(fp, 'w', encoding='utf-8') as f:
                f.write(fixed)
        fixed_count += 1

print(f"\n{'Would fix' if DRY_RUN else 'Fixed'} {fixed_count} files.")