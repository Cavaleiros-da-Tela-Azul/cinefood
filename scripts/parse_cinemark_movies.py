import json
import re

with open('C:/Users/gabri/.gemini/antigravity/brain/739f1de0-9e13-448b-a6db-bb2827f81d2b/.system_generated/steps/1268/output.txt', 'r', encoding='utf-8') as f:
    data = json.load(f)

md = data.get('markdown', '')

# Find all movies with images and links
movies = re.findall(r'\[\!\[([^\]]+)\]\((https?://[^\)]+)\)\]\((https?://[^\)]+)\)', md)
print(f"Found {len(movies)} linked movie posters in Cinemark:")
for title, img, link in movies[:20]:
    print(f"Movie: {title}")
    print(f"  Img: {img}")
    print(f"  Link: {link}")
