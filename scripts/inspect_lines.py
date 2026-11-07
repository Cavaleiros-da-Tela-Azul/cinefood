with open('cinefood/docs/prototipo/index.html', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

print("Lines 945 to 970:")
for i in range(944, min(970, len(lines))):
    print(f"{i+1}: {lines[i]}", end="")

print("\nLines 1130 to 1150:")
for i in range(1129, min(1150, len(lines))):
    print(f"{i+1}: {lines[i]}", end="")
