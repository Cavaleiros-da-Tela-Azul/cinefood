import json
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

with open('cinefood/scripts/analysis_results.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for name, info in data.items():
    print(f"\n{'='*50}")
    print(f"CINEMA CHAIN: {name} ({info.get('url')})")
    print(f"{'='*50}")
    b = info.get('branding', {})
    print("Colors:", b.get('colors'))
    print("Typography:", b.get('typography'))
    print("Spacing:", b.get('spacing'))
    print("Buttons:", b.get('components', {}).get('buttonPrimary'))
    print("Headings sample:")
    for h in info.get('headings_sample', [])[:5]:
        print(f"  * {h}")
    print("Food/Dining mentions:")
    for fd in info.get('food_sample', [])[:4]:
        print(f"  * {fd[:100]}")
    print("Format mentions:")
    for fmt in info.get('formats_sample', [])[:4]:
        print(f"  * {fmt[:100]}")
