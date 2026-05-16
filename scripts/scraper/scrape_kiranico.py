"""
Kiranicoからスキル・モンスター肉質データをスクレイピングする。
正しいURLパターン: /ja/data/skills, /ja/data/monsters

使い方:
    python scrape_kiranico.py skills    # スキルのみ
    python scrape_kiranico.py monsters  # モンスターのみ
    python scrape_kiranico.py           # 全部
"""
import csv
import re
import sys
import time
import hashlib
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://mhwilds.kiranico.com"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    )
}
ROOT = Path(__file__).parent.parent.parent
DATA_DIR = ROOT / "data"
CACHE_DIR = Path(__file__).parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)


# ─── HTTP ───────────────────────────────────────────────────────────────────

def fetch(url: str, delay: float = 1.0) -> str:
    cache_key = hashlib.md5(url.encode()).hexdigest()
    cache_file = CACHE_DIR / f"{cache_key}.html"
    if cache_file.exists():
        return cache_file.read_text(encoding="utf-8")
    time.sleep(delay)
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    html = r.text
    cache_file.write_text(html, encoding="utf-8")
    print(f"  fetched: {url}")
    return html


# ─── ユーティリティ ──────────────────────────────────────────────────────────

def fw2hw(s: str) -> str:
    """全角数字・記号を半角に変換"""
    return s.translate(str.maketrans("０１２３４５６７８９．＋－", "0123456789.+-"))


def write_csv(path: Path, fieldnames: list, rows: list) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    print(f"  → wrote {path.name} ({len(rows)} rows)")


# ─── スキル ─────────────────────────────────────────────────────────────────

# Kiranico h3セクション名 → CSV カテゴリ
SECTION_CATEGORY = {"Weapon": "normal", "Equip": "normal", "Group": "group", "Series": "series"}

# カテゴリ → (スキルCSV名, エフェクトCSV名)
CATEGORY_CSV = {
    "normal": ("skills_scraped", "skill_effects_scraped"),
    "group":  ("group_skills_scraped", "group_skill_effects_scraped"),
    "series": ("series_skills_scraped", "series_skill_effects_scraped"),
}

SKILL_FIELDS = [
    "id", "name", "max_level", "category", "description",
    "require_hitzone_physical", "require_tags", "match_any", "require_damage_type",
]
EFFECT_FIELDS = [
    "skill_id", "level",
    "attack_bonus", "affinity_bonus", "crit_multiplier",
    "element_multiplier", "attack_multiplier", "physical_multiplier",
    "element_bonus",
]


def parse_effect_text(text: str) -> dict:
    """日本語効果テキストから数値フィールドを抽出する。

    対応パターン:
      - 基礎攻撃力+N             → attack_bonus
      - 攻撃力をX.X倍            → attack_multiplier
      - 会心率+N%               → affinity_bonus
      - ダメージ倍率をX.X倍       → crit_multiplier (超会心)
      - (火|水|雷|氷|龍)属性…X.X倍 → element_multiplier
      - (火|水|雷|氷|龍)属性攻撃値+N → element_bonus
      - 威力をX.X倍 / 威力がX.X倍 / 与えるダメージX.X倍 → physical_multiplier
    """
    t = fw2hw(text)
    effect: dict = {}

    # 攻撃力ボーナス: 基礎攻撃力+N
    m = re.search(r"基礎攻撃力[+＋](\d+)", t)
    if m:
        effect["attack_bonus"] = float(m.group(1))

    # 攻撃倍率: 攻撃力をX.X倍
    m = re.search(r"攻撃力を(\d+\.\d+)倍", t)
    if m:
        effect["attack_multiplier"] = float(m.group(1))

    # 会心率: 会心率+N%
    m = re.search(r"会心率[+＋](\d+)[%％]", t)
    if m:
        effect["affinity_bonus"] = float(m.group(1))

    # 超会心: ダメージ倍率をX.X倍
    m = re.search(r"ダメージ倍率を(\d+\.\d+)倍", t)
    if m:
        effect["crit_multiplier"] = float(m.group(1))

    # 属性強化倍率: (火|水|雷|氷|龍)属性...X.X倍 / 属性値をX.X倍
    m = re.search(r"(?:火|水|雷|氷|龍)属性.{0,20}(\d+\.\d+)倍", t)
    if m:
        effect["element_multiplier"] = float(m.group(1))

    # 属性絶対値ボーナス: (火|水|雷|氷|龍)属性攻撃値[に]?+N
    # 「火属性攻撃値+40」も「火属性攻撃値に+50」も両方受け付ける
    m = re.search(r"(?:火|水|雷|氷|龍)属性攻撃値[にを]?[+＋](\d+)", t)
    if m:
        effect["element_bonus"] = float(m.group(1))

    # 物理倍率: 威力をX.X倍 / 威力がX.X倍 / 与えるダメージX.X倍
    # 「攻撃力をX.X倍」は除外（既に attack_multiplier で捕捉済み）
    m = re.search(r"(?<!攻撃力を)(?:威力[をが]|与えるダメージ)(\d+\.\d+)倍", t)
    if m:
        effect["physical_multiplier"] = float(m.group(1))

    return effect


def scrape_skill_detail(url: str) -> list[dict]:
    """スキル詳細ページからLv別効果を返す。"""
    html = fetch(url)
    soup = BeautifulSoup(html, "lxml")
    tables = soup.find_all("table")
    if not tables:
        return []

    rows = []
    for tr in tables[0].find_all("tr"):
        cells = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
        if len(cells) < 3:
            continue
        m = re.match(r"Lv(\d+)", cells[0])
        if not m:
            continue
        level = int(m.group(1))
        effect = parse_effect_text(cells[2])
        effect["level"] = level
        rows.append(effect)
    return rows


def scrape_skills() -> None:
    print("Scraping skills...")
    html = fetch(f"{BASE_URL}/ja/data/skills")
    soup = BeautifulSoup(html, "lxml")

    # h3タグとテーブルを順番に対応させる
    h3s = [h.get_text(strip=True) for h in soup.find_all("h3")]
    tables = soup.find_all("table")

    # カテゴリ別スキルリスト
    by_category: dict[str, list] = {"normal": [], "group": [], "series": []}

    for i, table in enumerate(tables[:4]):
        category = SECTION_CATEGORY.get(h3s[i] if i < len(h3s) else "", "normal")
        for tr in table.find_all("tr"):
            a = tr.find("a", href=re.compile(r"/data/skills/"))
            if not a:
                continue
            slug = a["href"].rstrip("/").split("/")[-1]
            tds = tr.find_all("td")
            desc = tds[1].get_text(strip=True) if len(tds) >= 2 else ""
            by_category[category].append({
                "slug": slug,
                "name": a.get_text(strip=True),
                "description": desc,
                "url": f"{BASE_URL}/ja/data/skills/{slug}",
            })

    total = sum(len(v) for v in by_category.values())
    print(f"  Skills found: {total} "
          f"(normal={len(by_category['normal'])}, "
          f"group={len(by_category['group'])}, "
          f"series={len(by_category['series'])})")

    for cat, skills in by_category.items():
        if not skills:
            continue
        skill_csv, effect_csv = CATEGORY_CSV[cat]
        skill_rows = []
        effect_rows = []

        for s in skills:
            print(f"  [{cat}] {s['name']}...")
            effects = scrape_skill_detail(s["url"])
            max_lv = max((e["level"] for e in effects), default=1)

            skill_rows.append({
                "id": s["slug"],
                "name": s["name"],
                "max_level": max_lv,
                "category": cat,
                "description": s["description"],
                "require_hitzone_physical": "",
                "require_tags": "",
                "match_any": "",
                "require_damage_type": "",
            })
            for e in effects:
                effect_rows.append({
                    "skill_id": s["slug"],
                    "level": e["level"],
                    "attack_bonus": e.get("attack_bonus", ""),
                    "affinity_bonus": e.get("affinity_bonus", ""),
                    "crit_multiplier": e.get("crit_multiplier", ""),
                    "element_multiplier": e.get("element_multiplier", ""),
                    "attack_multiplier": e.get("attack_multiplier", ""),
                    "physical_multiplier": e.get("physical_multiplier", ""),
                    "element_bonus": e.get("element_bonus", ""),
                })

        write_csv(DATA_DIR / f"{skill_csv}.csv", SKILL_FIELDS, skill_rows)
        write_csv(DATA_DIR / f"{effect_csv}.csv", EFFECT_FIELDS, effect_rows)


# ─── モンスター ──────────────────────────────────────────────────────────────

MONSTER_FIELDS = [
    "monster_id", "monster_name", "base_defense_rate",
    "variant_normal_mod", "variant_veteran_mod", "variant_apex_mod",
    "part_id", "part_name", "physical",
    "fire", "water", "thunder", "ice", "dragon",
    "wounded_physical_bonus", "enraged_physical",
    "enraged_fire", "enraged_water", "enraged_thunder", "enraged_ice", "enraged_dragon",
]

# 肉質テーブルの列インデックス
# [部位名, 状態, 斬, 打, 弾, 火, 水, 雷, 氷, 龍, 気絶]
COL_PART = 0
COL_STATE = 1
COL_SEVER = 2   # 物理として使用
COL_FIRE = 5
COL_WATER = 6
COL_THUNDER = 7
COL_ICE = 8
COL_DRAGON = 9


def parse_phys_table(table) -> list[dict]:
    """肉質テーブルを解析して部位リストを返す。"""
    parts: dict[str, dict] = {}

    for tr in table.find_all("tr"):
        cells = [td.get_text(strip=True) for td in tr.find_all("td")]
        if len(cells) <= COL_DRAGON:
            continue
        part_name = cells[COL_PART]
        if not part_name:
            continue
        state = cells[COL_STATE]  # '' or '傷口'

        def _int(idx: int) -> int:
            try:
                return int(cells[idx])
            except (ValueError, IndexError):
                return 0

        data = {
            "physical": _int(COL_SEVER),
            "fire":     _int(COL_FIRE),
            "water":    _int(COL_WATER),
            "thunder":  _int(COL_THUNDER),
            "ice":      _int(COL_ICE),
            "dragon":   _int(COL_DRAGON),
        }
        if part_name not in parts:
            parts[part_name] = {}
        parts[part_name]["wounded" if state == "傷口" else "normal"] = data

    result = []
    for part_name, states in parts.items():
        normal = states.get("normal")
        if not normal:
            continue
        wounded = states.get("wounded")
        wounded_bonus = ""
        if wounded:
            diff = wounded["physical"] - normal["physical"]
            if diff > 0:
                wounded_bonus = diff

        def zval(v: int) -> str | int:
            return "" if v == 0 else v

        result.append({
            "part_name": part_name,
            "physical": normal["physical"],
            "fire":    zval(normal["fire"]),
            "water":   zval(normal["water"]),
            "thunder": zval(normal["thunder"]),
            "ice":     zval(normal["ice"]),
            "dragon":  zval(normal["dragon"]),
            "wounded_physical_bonus": wounded_bonus,
        })
    return result


def scrape_monsters() -> None:
    print("Scraping monsters...")
    html = fetch(f"{BASE_URL}/ja/data/monsters")
    soup = BeautifulSoup(html, "lxml")

    monster_links = [
        (a.get_text(strip=True), a["href"].rstrip("/").split("/")[-1])
        for a in soup.select('a[href*="/data/monsters/"]')
    ]
    print(f"  Monsters found: {len(monster_links)}")

    rows = []
    for name, slug in monster_links:
        print(f"  {name} ({slug})...")
        url = f"{BASE_URL}/ja/data/monsters/{slug}"
        html = fetch(url)
        soup2 = BeautifulSoup(html, "lxml")

        tables = soup2.find_all("table")
        if len(tables) < 2:
            print(f"  WARNING: No physiology table for {name}")
            continue

        parts = parse_phys_table(tables[1])
        for i, part in enumerate(parts):
            rows.append({
                "monster_id": slug,
                "monster_name": name,
                "base_defense_rate": "1.0",
                "variant_normal_mod": "1.0",
                "variant_veteran_mod": "",
                "variant_apex_mod": "",
                "part_id": f"part-{i + 1}",
                "part_name": part["part_name"],
                "physical": part["physical"],
                "fire":    part["fire"],
                "water":   part["water"],
                "thunder": part["thunder"],
                "ice":     part["ice"],
                "dragon":  part["dragon"],
                "wounded_physical_bonus": part["wounded_physical_bonus"],
                "enraged_physical": "",
                "enraged_fire": "", "enraged_water": "",
                "enraged_thunder": "", "enraged_ice": "", "enraged_dragon": "",
            })

    write_csv(DATA_DIR / "monsters_scraped.csv", MONSTER_FIELDS, rows)


# ─── エントリポイント ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "all"
    if target in ("all", "skills"):
        scrape_skills()
    if target in ("all", "monsters"):
        scrape_monsters()
    print("Done.")
