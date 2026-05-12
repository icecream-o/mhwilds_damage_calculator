"""
HTTPキャッシュ付きフェッチユーティリティ。
1秒のレート制限を設け、Kiranicoサーバーに負荷をかけない。
キャッシュは scripts/scraper/cache/ に保存（gitignore済み）。
"""
import time
import hashlib
from pathlib import Path

import requests

CACHE_DIR = Path(__file__).parent.parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)

HEADERS = {
    "User-Agent": (
        "MHWilds-Damage-Calculator-DataScraper/1.0 "
        "(https://github.com/local/mhwilds_damage_calculator)"
    )
}


def fetch(url: str, delay: float = 1.0, force: bool = False) -> str:
    """
    URLのHTMLを返す。キャッシュがあればそれを返す。

    Args:
        url: 取得するURL
        delay: リクエスト前の待機秒数（キャッシュHITなら不要）
        force: True なら強制的に再取得してキャッシュを更新
    """
    cache_key = hashlib.md5(url.encode()).hexdigest()
    cache_file = CACHE_DIR / f"{cache_key}.html"

    if cache_file.exists() and not force:
        return cache_file.read_text(encoding="utf-8")

    time.sleep(delay)
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    html = resp.text
    cache_file.write_text(html, encoding="utf-8")
    return html
