import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

with open('cinefood/docs/prototipo/index.html', 'r', encoding='utf-8', errors='replace') as f:
    text = f.read()

idx = text.find('<script>')
if idx != -1:
    script_part = text[idx:]
    import re
    functions = re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', script_part)
    print("Found functions in script:")
    for fn in set(functions):
        print(f"  - {fn}")
