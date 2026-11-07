import requests
import sys

# High quality reliable movie poster and backdrop images from TMDB/Wikimedia/Unsplash
candidate_images = {
    # Posters (2:3 ratio)
    "dune2_poster": "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
    "interstellar_poster": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    "oppenheimer_poster": "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    "poor_things_poster": "https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg",
    "past_lives_poster": "https://image.tmdb.org/t/p/w500/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg",
    "challengers_poster": "https://image.tmdb.org/t/p/w500/H6vYt2Kw13w7OmL4qB0qL9g3Yq.jpg",
    
    # Backdrops (16:9 / 21:9 ratio)
    "dune2_backdrop": "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg",
    "interstellar_backdrop": "https://image.tmdb.org/t/p/original/rAiYTsqJJR0KP8UN8vJjZha82Te.jpg",
    "oppenheimer_backdrop": "https://image.tmdb.org/t/p/original/fm6K9vYQ7jSS2mGeLImMuOqg3YQ.jpg",

    # Gastronomy (Unsplash curated)
    "burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "popcorn": "https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80",
    "cocktail": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
    "nachos": "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80",
    "beer": "https://images.unsplash.com/photo-1608270119330-804b407b1a13?auto=format&fit=crop&w=600&q=80",
    "cinema_seats": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80"
}

headers = {'User-Agent': 'Mozilla/5.0'}
for name, url in candidate_images.items():
    try:
        r = requests.head(url, headers=headers, timeout=5, allow_redirects=True)
        print(f"{name}: {r.status_code} ({'OK' if r.status_code == 200 else 'FAIL'})")
    except Exception as e:
        print(f"{name}: ERROR {e}")
