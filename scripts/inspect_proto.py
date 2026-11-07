import json

with open('cinefood/docs/prototipo/index.html', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
for i, line in enumerate(lines):
    if 'id="layout-' in line or 'switchLayout' in line:
        print(f"Line {i+1}: {line.strip()[:120]}")
