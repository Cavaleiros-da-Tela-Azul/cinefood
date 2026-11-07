import requests

extra_urls = {
    "dune2_backdrop_test": "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg",
    "dune2_bg2": "https://image.tmdb.org/t/p/w1280/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    "interstellar_bg": "https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    "oppenheimer_bg": "https://image.tmdb.org/t/p/w1280/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg",
    "gladiator2": "https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
    "joker2": "https://image.tmdb.org/t/p/w500/aciP8Km0waTLGEYfkhYS3dyNXCd.jpg",
    "wicked": "https://image.tmdb.org/t/p/w500/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg",
    "beer_test": "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80",
    "lounge_test": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80"
}

headers = {'User-Agent': 'Mozilla/5.0'}
for name, url in extra_urls.items():
    try:
        r = requests.head(url, headers=headers, timeout=5)
        print(f"{name}: {r.status_code}")
    except Exception as e:
        print(f"{name}: ERROR {e}")
