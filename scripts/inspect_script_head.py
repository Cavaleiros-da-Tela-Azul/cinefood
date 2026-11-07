import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

with open('cinefood/docs/prototipo/index.html', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

for i in range(2010, 2080):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}", end="")
