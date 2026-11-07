import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

with open('cinefood/docs/prototipo/index.html', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
for i in range(945, min(1200, len(lines))):
    line = lines[i]
    if 'id=' in line or '<!-- ===' in line:
        print(f"Line {i+1}: {line.strip()[:100]}")
