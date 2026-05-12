"""
Kiranicoスキルページのパーサー。
フィクスチャHTMLをもとに構築。実際のサイトの構造が異なる場合は
parse_skills_list / parse_skill_detail のセレクタを修正する。
"""
import re
from bs4 import BeautifulSoup


def parse_skills_list(html: str) -> list[dict]:
    """
    スキル一覧ページのHTMLからスキルリストを抽出する。

    Returns:
        [{"name": str, "maxLevel": int, "description": str, "detailPath": str}, ...]
    """
    soup = BeautifulSoup(html, "lxml")
    result = []
    rows = soup.select("table tbody tr")
    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 2:
            continue
        name_cell = cells[0]
        link = name_cell.find("a")
        if not link:
            continue
        name = link.get_text(strip=True)
        detail_path = link.get("href", "")
        try:
            max_level = int(cells[1].get_text(strip=True))
        except ValueError:
            continue
        description = cells[2].get_text(strip=True) if len(cells) > 2 else ""
        result.append({
            "name": name,
            "maxLevel": max_level,
            "description": description,
            "detailPath": detail_path,
        })
    return result


def parse_skill_detail(html: str) -> list[dict]:
    """
    スキル個別ページのHTMLからレベル別効果を抽出する。

    Returns:
        [{"level": int, "rawEffect": str}, ...]
    """
    soup = BeautifulSoup(html, "lxml")
    result = []
    rows = soup.select("table tbody tr")
    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 2:
            continue
        try:
            level = int(cells[0].get_text(strip=True))
        except ValueError:
            continue
        raw_effect = cells[1].get_text(strip=True)
        result.append({"level": level, "rawEffect": raw_effect})
    return result


# ──────────────────────────────────────────────
# rawEffect → 数値フィールド変換
# ──────────────────────────────────────────────

_ATTACK_RE = re.compile(r"Attack\s*([+-]\d+)", re.IGNORECASE)
_AFFINITY_RE = re.compile(r"Affinity\s*([+-]\d+)%?", re.IGNORECASE)
_CRIT_RE = re.compile(r"Critical\s*Multiplier\s*([0-9.]+)x?", re.IGNORECASE)
_ELEM_RE = re.compile(r"Elemental\s*Attack\s*x\s*([0-9.]+)", re.IGNORECASE)


def parse_raw_effect(raw: str) -> dict:
    """
    Kiranicoの効果文字列 → SkillEffectByLevel 形式の辞書。

    Examples:
        "Attack +9"                → {"attackBonus": 9.0}
        "Affinity +15%"            → {"affinityBonus": 15.0}
        "Critical Multiplier 1.4x" → {"critMultiplier": 1.4}
        "Elemental Attack x1.10"   → {"elementMultiplier": 1.1}
    """
    if m := _ATTACK_RE.search(raw):
        return {"attackBonus": float(m.group(1))}
    if m := _AFFINITY_RE.search(raw):
        return {"affinityBonus": float(m.group(1))}
    if m := _CRIT_RE.search(raw):
        return {"critMultiplier": float(m.group(1))}
    if m := _ELEM_RE.search(raw):
        return {"elementMultiplier": float(m.group(1))}
    return {"unknownEffect": raw}


def scrape_skills(fetch_fn, base_url: str = "https://mhwilds.kiranico.com") -> tuple[list, list]:
    """
    Kiranicoからスキル一覧と詳細を取得し、skills.csv 形式の行リストを返す。

    Args:
        fetch_fn: fetch(url) → html str を返す関数
        base_url: KiranicoのベースURL

    Returns:
        (skill_rows, effect_rows) タプル
    """
    list_html = fetch_fn(f"{base_url}/skills")
    skills = parse_skills_list(list_html)

    skill_rows = []
    effect_rows = []
    for s in skills:
        skill_id = s["detailPath"].rstrip("/").split("/")[-1]
        skill_rows.append({
            "id": skill_id,
            "name": s["name"],
            "max_level": s["maxLevel"],
            "category": "normal",
            "description": s.get("description", ""),
            "require_hitzone_physical": "",
            "require_tags": "",
            "match_any": "",
            "require_damage_type": "",
        })
        detail_html = fetch_fn(f"{base_url}{s['detailPath']}")
        raw_effects = parse_skill_detail(detail_html)
        for re_entry in raw_effects:
            parsed = parse_raw_effect(re_entry["rawEffect"])
            effect_rows.append({
                "skill_id": skill_id,
                "level": re_entry["level"],
                "attack_bonus": parsed.get("attackBonus", ""),
                "affinity_bonus": parsed.get("affinityBonus", ""),
                "crit_multiplier": parsed.get("critMultiplier", ""),
                "element_multiplier": parsed.get("elementMultiplier", ""),
                "attack_multiplier": parsed.get("attackMultiplier", ""),
                "physical_multiplier": parsed.get("physicalMultiplier", ""),
            })

    return skill_rows, effect_rows
