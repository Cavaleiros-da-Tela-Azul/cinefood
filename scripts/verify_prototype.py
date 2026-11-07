import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

with open('cinefood/docs/prototipo/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

checks = [
    ('Solar Sunset layout', 'id="layout-solar-sunset"'),
    ('Alamo layout', 'id="layout-boutique-gold"'),
    ('Everyman layout', 'id="layout-cyber-imax"'),
    ('AMC / Cinemark layout', 'id="layout-cinephile-minimal"'),
    ('User palette #FF4D00', '#FF4D00'),
    ('User palette #FF9F1C', '#FF9F1C'),
    ('User palette #FFD166', '#FFD166'),
    ('User palette #1B1B3A', '#1B1B3A'),
    ('User palette #0B0B12', '#0B0B12'),
    ('Alamo Gold #F5B324', '#F5B324'),
    ('Everyman Rose #EE9CA6', '#EE9CA6'),
    ('AMC Red #CE0E2D', '#CE0E2D'),
    ('Seat Grid container', 'id="grid-seats"'),
    ('Concession Drawer', 'id="drawer-concession"'),
    ('Checkout Modal', 'id="modal-checkout"'),
    ('Sonner Toaster', 'id="sonner-toaster"'),
    ('Emil active:scale-[0.97]', 'active:scale-[0.97]'),
    ('Tabular nums', 'tabular-nums'),
]

all_passed = True
for name, token in checks:
    count = text.count(token)
    if count > 0:
        print(f"PASS: {name} (found {count} times)")
    else:
        print(f"FAIL: {name} (NOT FOUND)")
        all_passed = False

if all_passed:
    print("\nALL PROTO VERIFICATION CHECKS PASSED PERFECTLY!")
