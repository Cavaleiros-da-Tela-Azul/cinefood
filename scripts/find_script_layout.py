import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

with open('cinefood/docs/prototipo/index.html', 'r', encoding='utf-8', errors='replace') as f:
    text = f.read()

idx = text.find('<script>')
if idx != -1:
    script_part = text[idx:]
    for line in script_part.splitlines():
        if 'layout' in line.lower():
            print(line.strip())
