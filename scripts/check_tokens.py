import json

with open('cinefood/src/design-tokens-m3.json', 'r', encoding='utf-8') as f:
    tokens = json.load(f)

print("Current token keys:", list(tokens.keys()))
if 'cinemaBenchmarks' in tokens:
    print("Found cinemaBenchmarks!")
else:
    print("No cinemaBenchmarks key yet.")
