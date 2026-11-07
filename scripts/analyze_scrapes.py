import json
import sys
import re

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

scrapes = [
    (1259, 'Alamo Drafthouse', 'https://drafthouse.com'),
    (1263, 'Everyman Cinemas', 'https://www.everymancinema.com'),
    (1268, 'Cinemark Brasil', 'https://www.cinemark.com.br'),
    (1270, 'AMC Theatres', 'https://www.amctheatres.com'),
    (1274, 'Odeon UK', 'https://www.odeon.co.uk')
]

analysis = {}

for step, name, url in scrapes:
    path = f'C:/Users/gabri/.gemini/antigravity/brain/739f1de0-9e13-448b-a6db-bb2827f81d2b/.system_generated/steps/{step}/output.txt'
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            branding = data.get('branding', {})
            markdown = data.get('markdown', '')
            
            # Extract headings
            headings = re.findall(r'^(#{1,4}\s+.+)$', markdown, re.MULTILINE)
            # Look for food / dining keywords
            food_mentions = [line.strip() for line in markdown.splitlines() if any(k in line.lower() for k in ['food', 'menu', 'snack', 'pipoca', 'dine', 'cocktail', 'drink', 'beer', 'combo', 'bar'])]
            # Look for format keywords
            format_mentions = [line.strip() for line in markdown.splitlines() if any(k in line.lower() for k in ['imax', 'xd', 'dolby', '3d', 'dbox', 'laser', '35mm', 'prime'])]
            
            analysis[name] = {
                'url': url,
                'branding': branding,
                'headings_sample': headings[:12],
                'food_sample': food_mentions[:10],
                'formats_sample': format_mentions[:10],
                'markdown_length': len(markdown)
            }
    except Exception as e:
        analysis[name] = {'error': str(e)}

with open('cinefood/scripts/analysis_results.json', 'w', encoding='utf-8') as f:
    json.dump(analysis, f, indent=2, ensure_ascii=False)

print("Analysis successfully written to cinefood/scripts/analysis_results.json")
