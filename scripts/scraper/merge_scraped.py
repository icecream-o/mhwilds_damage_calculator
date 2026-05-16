"""
スクレイプされたCSVを既存CSVにマージする。
- 既存スキルのIDと適用条件フィールドを維持
- スクレイプされた効果値（実際のWildsデータ）を使用
- 新スキルはスクレイプされたIDをそのまま使用
"""
import csv
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
DATA = ROOT / "data"

# ─── 日本語スキル名 → 既存英語ID マッピング ────────────────────────────────────
# ─── 手動の適用条件（スクレイパーでは判定できないもの）──────────────────────
# 心眼: 硬い部位（≤45）への威力倍率。Wildsの正確な閾値は不明だが、弱点特効の
#       鏡像値として≤45を採用。実測情報が出たら調整。
MANUAL_APPLICABILITY = {
    "xin-yan": {"require_hitzone_physical_max": "45"},
}


NAME_TO_ID = {
    "攻撃":           "attack",
    "見切り":          "critical-eye",
    "超会心":          "critical-boost",
    "弱点特効":        "weakness-exploit",
    "抜刀術【技】":     "punishing-draw-tech",
    "抜刀術【力】":     "punishing-draw-power",
    "飛燕":           "ranger",
    "砲術":           "artillery",
    "挑戦者":          "agitator",
    "逆襲":           "resentment",
    "フルチャージ":     "peak-performance",
    "会心撃【属性】":   "element-crit",
    "水属性攻撃強化":   "water-attack",
    "業物":           "razor-sharp",
}

# 既存スキルの適用条件フィールドを読み込む
def load_applicability(csv_path: Path) -> dict:
    """id → 適用条件フィールド辞書"""
    result = {}
    with open(csv_path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            result[row["id"]] = {
                "require_hitzone_physical":     row.get("require_hitzone_physical", ""),
                "require_hitzone_physical_max": row.get("require_hitzone_physical_max", ""),
                "require_tags":                 row.get("require_tags", ""),
                "match_any":                   row.get("match_any", ""),
                "require_damage_type":         row.get("require_damage_type", ""),
            }
    return result


def read_csv(path: Path) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, fieldnames: list, rows: list) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    print(f"  → wrote {path.name} ({len(rows)} rows)")


# ─── skills + skill_effects ─────────────────────────────────────────────────

def merge_skills():
    applicability = load_applicability(DATA / "skills.csv")

    scraped_skills  = read_csv(DATA / "skills_scraped.csv")
    scraped_effects = read_csv(DATA / "skill_effects_scraped.csv")

    # slug → mapped ID (英語ID優先)
    slug_to_id: dict[str, str] = {}
    skill_rows = []

    for s in scraped_skills:
        slug = s["id"]
        name = s["name"]
        mapped_id = NAME_TO_ID.get(name, slug)
        slug_to_id[slug] = mapped_id

        appl = applicability.get(mapped_id, {})
        # 心眼など、scraped IDではなくmapped IDに対するハードコード適用条件
        manual_appl = MANUAL_APPLICABILITY.get(mapped_id, {})
        skill_rows.append({
            "id":                           mapped_id,
            "name":                         name,
            "max_level":                    s["max_level"],
            "category":                     s["category"],
            "description":                  s["description"],
            "require_hitzone_physical":     appl.get("require_hitzone_physical", "")     or manual_appl.get("require_hitzone_physical", ""),
            "require_hitzone_physical_max": appl.get("require_hitzone_physical_max", "") or manual_appl.get("require_hitzone_physical_max", ""),
            "require_tags":                 appl.get("require_tags", "")                 or manual_appl.get("require_tags", ""),
            "match_any":                    appl.get("match_any", "")                    or manual_appl.get("match_any", ""),
            "require_damage_type":          appl.get("require_damage_type", "")          or manual_appl.get("require_damage_type", ""),
        })

    # エフェクトのskill_idをマッピング
    SKILL_FIELDS = [
        "id", "name", "max_level", "category", "description",
        "require_hitzone_physical", "require_hitzone_physical_max",
        "require_tags", "match_any", "require_damage_type",
    ]
    EFFECT_FIELDS = [
        "skill_id", "level",
        "attack_bonus", "affinity_bonus", "crit_multiplier",
        "element_multiplier", "attack_multiplier", "physical_multiplier",
        "element_bonus",
    ]

    effect_rows = []
    for e in scraped_effects:
        slug = e["skill_id"]
        mapped_id = slug_to_id.get(slug, slug)
        effect_rows.append({
            "skill_id":           mapped_id,
            "level":              e["level"],
            "attack_bonus":       e.get("attack_bonus", ""),
            "affinity_bonus":     e.get("affinity_bonus", ""),
            "crit_multiplier":    e.get("crit_multiplier", ""),
            "element_multiplier": e.get("element_multiplier", ""),
            "attack_multiplier":  e.get("attack_multiplier", ""),
            "physical_multiplier":e.get("physical_multiplier", ""),
            "element_bonus":      e.get("element_bonus", ""),
        })

    write_csv(DATA / "skills.csv",        SKILL_FIELDS,  skill_rows)
    write_csv(DATA / "skill_effects.csv", EFFECT_FIELDS, effect_rows)


# ─── group スキル ──────────────────────────────────────────────────────────

def merge_group():
    SKILL_FIELDS = [
        "id", "name", "max_level", "category", "description",
        "require_hitzone_physical", "require_hitzone_physical_max",
        "require_tags", "match_any", "require_damage_type",
    ]
    EFFECT_FIELDS = [
        "skill_id", "level",
        "attack_bonus", "affinity_bonus", "crit_multiplier",
        "element_multiplier", "attack_multiplier", "physical_multiplier",
        "element_bonus",
    ]
    write_csv(DATA / "group_skills.csv",        SKILL_FIELDS, read_csv(DATA / "group_skills_scraped.csv"))
    write_csv(DATA / "group_skill_effects.csv", EFFECT_FIELDS, read_csv(DATA / "group_skill_effects_scraped.csv"))


# ─── series スキル ─────────────────────────────────────────────────────────

def merge_series():
    SKILL_FIELDS = [
        "id", "name", "max_level", "category", "description",
        "require_hitzone_physical", "require_tags", "match_any", "require_damage_type",
    ]
    EFFECT_FIELDS = [
        "skill_id", "level",
        "attack_bonus", "affinity_bonus", "crit_multiplier",
        "element_multiplier", "attack_multiplier", "physical_multiplier",
    ]
    write_csv(DATA / "series_skills.csv",        SKILL_FIELDS, read_csv(DATA / "series_skills_scraped.csv"))
    write_csv(DATA / "series_skill_effects.csv", EFFECT_FIELDS, read_csv(DATA / "series_skill_effects_scraped.csv"))


# ─── monsters ─────────────────────────────────────────────────────────────

def merge_monsters():
    MONSTER_FIELDS = [
        "monster_id", "monster_name", "base_defense_rate",
        "variant_normal_mod", "variant_veteran_mod", "variant_apex_mod",
        "part_id", "part_name", "physical",
        "fire", "water", "thunder", "ice", "dragon",
        "wounded_physical_bonus", "enraged_physical",
        "enraged_fire", "enraged_water", "enraged_thunder", "enraged_ice", "enraged_dragon",
    ]
    write_csv(DATA / "monsters.csv", MONSTER_FIELDS, read_csv(DATA / "monsters_scraped.csv"))


if __name__ == "__main__":
    print("Merging skills...")
    merge_skills()
    print("Merging group skills...")
    merge_group()
    print("Merging series skills...")
    merge_series()
    print("Merging monsters...")
    merge_monsters()
    print("Done.")
