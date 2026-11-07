import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

with open('cinefood/docs/prototipo/index.html', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'switchLayout' in line or 'data-version' in line or 'Arquétipo' in line or 'V1' in line or 'V2' in line or 'V3' in line or 'V4' in line:
        print(f"Line {i+1}: {line.strip()[:110]}")
