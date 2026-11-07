import subprocess
import sys
import re

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

res = subprocess.run(['git', '-C', 'cinefood', 'show', '9ec8c0d:docs/prototipo/index.html'], capture_output=True)
content = res.stdout.decode('utf-8', errors='replace')

print(f"Total lines: {len(content.splitlines())}")

# Search for img tags or background images
images = re.findall(r'(https?://[^\s"\'\)]+\.(?:jpg|jpeg|png|webp|svg))', content, re.IGNORECASE)
print(f"Found {len(images)} image URLs:")
for img in set(images[:20]):
    print(f"  - {img}")

# Search for layout divs
layouts = re.findall(r'id=["\'](layout-[^"\']+)["\']', content)
print("Layouts found:", set(layouts))
