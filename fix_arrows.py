import os, re

SKIP_DIRS = {'node_modules', '.next', '.wrangler', '.git', '__pycache__'}
EXTENSIONS = ('.tsx', '.jsx')

files = []
for root, dirs, filenames in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    for f in filenames:
        if f.endswith(EXTENSIONS):
            files.append(os.path.join(root, f))

fixed_count = 0
for fp in sorted(files):
    with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
        original = f.read()

    # Ganti -> dan <- di JSX text node jadi entitas HTML
    fixed = original
    fixed = fixed.replace('->', '&rarr;')
    fixed = fixed.replace('<-', '&larr;')

    if fixed != original:
        print(f'FIXED: {fp}')
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(fixed)
        fixed_count += 1

print(f'\nFixed {fixed_count} files.')