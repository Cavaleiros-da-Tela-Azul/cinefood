import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

with open('cinefood/docs/prototipo/index.html', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

for i in range(1130, len(lines)):
    line = lines[i]
    if 'id=' in line or '<!-- ===' in line or '</main>' in line or '<script>' in line:
        print(f"Line {i+1}: {line.strip()[:100]}")
