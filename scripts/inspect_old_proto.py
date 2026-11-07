import sys
import re

with open('cinefood/scripts/proto_9ec8c0d.html', 'r', encoding='utf-8', errors='replace') as f:
    text = f.read()

print(f"Total characters: {len(text)}")
print(f"Total lines: {len(text.splitlines())}")

# Find all image URLs used
images = re.findall(r'src=["\'](http[^"\']+)["\']', text)
print(f"Found {len(images)} image URLs:")
for img in images[:15]:
    print(f"  - {img}")

# Find main sections
sections = re.findall(r'<div id=["\'](layout-[^"\']+)["\']', text)
print("Layout sections found:", sections)
