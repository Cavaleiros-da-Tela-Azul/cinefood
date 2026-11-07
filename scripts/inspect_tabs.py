with open('cinefood/docs/prototipo/index.html', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

for i in range(250, 360):
    print(f"{i+1}: {lines[i]}", end="")
