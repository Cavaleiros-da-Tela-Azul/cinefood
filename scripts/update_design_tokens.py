import json

with open('cinefood/src/design-tokens-m3.json', 'r', encoding='utf-8') as f:
    tokens = json.load(f)

tokens['cinemaBenchmarks'] = {
    'alamoDrafthouse': {
        'url': 'https://drafthouse.com',
        'scrapedAt': '2026-11-07',
        'archetype': 'Dine-In Cult Cinephile & Scratch Kitchen',
        'colors': {
            'primary': '#F5B324',
            'accent': '#F5B324',
            'background': '#090909',
            'surface': '#141414',
            'textPrimary': '#FFFDF7',
            'textSecondary': '#A1A1AA',
            'border': '#27272A'
        },
        'typography': {
            'heading': 'Futura-Pt, -apple-system, sans-serif',
            'body': 'Futura-Pt, sans-serif'
        },
        'shape': {
            'buttonRadius': '0px',
            'cardRadius': '4px'
        },
        'layoutSignature': 'Split Marquee 50/50, Horizontal Matrix Table by Hall and Time, In-Theater Silent Order'
    },
    'everymanCinemas': {
        'url': 'https://www.everymancinema.com',
        'scrapedAt': '2026-11-07',
        'archetype': 'Ultra-Luxury Boutique Hospitality & Velvet Salon',
        'colors': {
            'primary': '#EE9CA6',
            'secondary': '#EFCFD3',
            'accent': '#EE9CA6',
            'background': '#1A1818',
            'surface': '#212020',
            'textPrimary': '#FFFFFF',
            'textSecondary': '#D1D5DB'
        },
        'typography': {
            'heading': 'Baskerville Std, Georgia, serif',
            'body': 'Roboto, sans-serif'
        },
        'shape': {
            'buttonRadius': '8px',
            'cardRadius': '16px'
        },
        'layoutSignature': 'Editorial Broadsheet, Venue First Selector, Velvet Love-Sofa Map, Sommelier & Sharing Plates'
    },
    'cinemarkBrasil': {
        'url': 'https://www.cinemark.com.br',
        'scrapedAt': '2026-11-07',
        'archetype': 'High-Volume Multiplex & Express Loyalty',
        'colors': {
            'primary': '#BE0D0D',
            'accent': '#FF3939',
            'background': '#12100D',
            'surface': '#1A202C',
            'textPrimary': '#FFFFFF',
            'textMuted': '#AAA9A8'
        },
        'typography': {
            'heading': 'Oswald, sans-serif',
            'body': 'Work Sans, sans-serif'
        },
        'shape': {
            'buttonRadius': '10px',
            'cardRadius': '10px'
        },
        'layoutSignature': 'Horizontal Date Carousel, Technology Badges (XD, D-BOX, Prime), Snack Bar Express 1-Click'
    },
    'amcTheatres': {
        'url': 'https://www.amctheatres.com',
        'scrapedAt': '2026-11-07',
        'archetype': 'Blockbuster Megaplex & Format Showcase',
        'colors': {
            'primary': '#CE0E2D',
            'accent': '#CE0E2D',
            'background': '#000000',
            'surface': '#111111',
            'textPrimary': '#FFFFFF',
            'textSecondary': '#A8B8BC'
        },
        'typography': {
            'heading': 'Gordita, Helvetica, sans-serif',
            'body': 'Gordita, Helvetica, sans-serif'
        },
        'shape': {
            'buttonRadius': '9999px',
            'cardRadius': '6px'
        },
        'layoutSignature': 'Full-Bleed 21:9 Widescreen Hero, Stadium Pill Pills, IMAX/Dolby Format Radar, Snack & Sip Combos'
    },
    'solarSunset': {
        'origin': 'User Official Palette Image',
        'colors': {
            'primary': '#FF4D00',
            'secondary': '#FF9F1C',
            'accent': '#FFD166',
            'surface': '#1B1B3A',
            'background': '#0B0B12',
            'textPrimary': '#FFFFFF',
            'textSecondary': '#E2E8F0'
        },
        'typography': {
            'heading': 'Space Grotesk, sans-serif',
            'body': 'Plus Jakarta Sans, sans-serif'
        },
        'shape': {
            'buttonRadius': '12px',
            'cardRadius': '20px'
        },
        'layoutSignature': 'Asymmetric 12-Column Bento Grid, Countdown Clock Marquee, Vinyl 35mm Player, Acoustic Sweet-Spot Heatmap'
    }
}

with open('cinefood/src/design-tokens-m3.json', 'w', encoding='utf-8') as f:
    json.dump(tokens, f, indent=2, ensure_ascii=False)

print("Updated cinefood/src/design-tokens-m3.json successfully!")
