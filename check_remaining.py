import os, collections

EXTENSIONS = ('.tsx', '.ts', '.js', '.jsx', '.css', '.json', '.md', '.toml')
SKIP_DIRS = {'node_modules', '.next', '.wrangler', '.git', '__pycache__'}

chars = collections.Counter()

for root, dirs, filenames in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    for f in filenames:
        if f.endswith(EXTENSIONS):
            fp = os.path.join(root, f)
            with open(fp, 'r', encoding='utf-8', errors='ignore') as fh:
                for line in fh:
                    for ch in line:
                        if ord(ch) > 127:
                            chars[ch] += 1

for ch, count in chars.most_common(30):
    print(f'{count:4d}  U+{ord(ch):04X}  {repr(ch)}')