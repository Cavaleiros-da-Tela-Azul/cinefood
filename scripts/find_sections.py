import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

with open('cinefood/docs/prototipo/index.html', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

markers = [
    'id="layout-boutique-gold"',
    'id="layout-cyber-imax"',
    'id="layout-cinephile-minimal"',
    'id="layout-solar-sunset"',
    'id="view-catalog-cinema"',
    'id="view-seats"'
]

for i, line in enumerate(lines):
    for m in markers:
        if m in line:
            print(f"Line {i+1}: {line.strip()[:100]}")
