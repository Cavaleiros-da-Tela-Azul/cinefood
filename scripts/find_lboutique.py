import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

with open('cinefood/docs/prototipo/index.html', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'lBoutique' in line:
        print(f"Line {i+1}: {line}")
        for j in range(max(0, i-5), min(len(lines), i+25)):
            print(f"  {j+1}: {lines[j]}", end="")
        break
