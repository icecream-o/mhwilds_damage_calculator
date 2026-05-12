"""
Kiranicoモンスター肉質ページのパーサー。
フィクスチャHTMLをもとに構築。実際のサイトの列順や表記が異なる場合は
parse_monster_page のロジックを調整する。
"""
from bs4 import BeautifulSoup


# Kiranicoの物理肉質列インデックス（Sever=1, Blunt=2, Ranged=3）
PHYSICAL_COL_IDX = 1   # 斬（Sever）を物理の代表値として使用
FIRE_COL_IDX = 4
WATER_COL_IDX = 5
ICE_COL_IDX = 6
THUNDER_COL_IDX = 7
DRAGON_COL_IDX = 8


def parse_monster_page(html: str) -> list[dict]:
    """
    モンスター個別ページのHTMLから部位肉質データを抽出する。

    Returns:
        [{"part_name": str, "physical": int, "fire": int, "water": int,
          "ice": int, "thunder": int, "dragon": int}, ...]
    """
    soup = BeautifulSoup(html, "lxml")
    result = []
    # 肉質テーブルを探す（id="physiology" または最初のtable）
    table = soup.find("table", {"id": "physiology"}) or soup.find("table")
    if not table:
        return result

    tbody = table.find("tbody")
    rows = tbody.find_all("tr") if tbody else []
    for row in rows:
        cells = row.find_all("td")
        if len(cells) < DRAGON_COL_IDX + 1:
            continue

        def _val(idx: int) -> int:
            text = cells[idx].get_text(strip=True)
            try:
                return int(text)
            except ValueError:
                return 0

        result.append({
            "part_name": cells[0].get_text(strip=True),
            "physical": _val(PHYSICAL_COL_IDX),
            "fire": _val(FIRE_COL_IDX),
            "water": _val(WATER_COL_IDX),
            "ice": _val(ICE_COL_IDX),
            "thunder": _val(THUNDER_COL_IDX),
            "dragon": _val(DRAGON_COL_IDX),
        })
    return result


def scrape_monsters(fetch_fn, base_url: str = "https://mhwilds.kiranico.com") -> list[dict]:
    """
    Kiranicoからモンスター一覧と肉質データを取得し、monsters.csv 形式の行リストを返す。
    """
    list_html = fetch_fn(f"{base_url}/monsters")
    soup = BeautifulSoup(list_html, "lxml")
    monster_links = soup.select("table tbody tr td a")

    monster_rows = []
    for link in monster_links:
        monster_name = link.get_text(strip=True)
        detail_path = link.get("href", "")
        monster_id = detail_path.rstrip("/").split("/")[-1]

        detail_html = fetch_fn(f"{base_url}{detail_path}")
        parts = parse_monster_page(detail_html)

        for i, part in enumerate(parts):
            part_id = f"part-{i+1}"
            monster_rows.append({
                "monster_id": monster_id,
                "monster_name": monster_name,
                "base_defense_rate": "1.0",
                "variant_normal_mod": "1.0",
                "variant_veteran_mod": "",
                "variant_apex_mod": "",
                "part_id": part_id,
                "part_name": part["part_name"],
                "physical": part["physical"],
                "fire": part["fire"] if part["fire"] != 0 else "",
                "water": part["water"] if part["water"] != 0 else "",
                "thunder": part["thunder"] if part["thunder"] != 0 else "",
                "ice": part["ice"] if part["ice"] != 0 else "",
                "dragon": part["dragon"] if part["dragon"] != 0 else "",
                "wounded_physical_bonus": "",
                "enraged_physical": "",
                "enraged_fire": "", "enraged_water": "",
                "enraged_thunder": "", "enraged_ice": "", "enraged_dragon": "",
            })

    return monster_rows
