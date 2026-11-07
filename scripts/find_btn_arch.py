with open('cinefood/docs/prototipo/index.html', 'r', encoding='utf-8', errors='replace') as f:
    for i, line in enumerate(f):
        if 'btn-arch' in line:
            print(f"Line {i+1}: {line.strip()}")
