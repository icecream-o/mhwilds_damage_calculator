"""
既存の public/data/*.json → data/*.csv に逆変換するシードスクリプト。
初回のみ実行する。以後は csv_to_json.py を使って JSON を再生成すること。

実行:
    python seed_from_json.py
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
DATA_DIR = ROOT / "data"
PUBLIC_DATA_DIR = ROOT / "public" / "data"

DATA_DIR.mkdir(exist_ok=True)

ELEMENT_NAME_REVERSE = {"火": "fire", "水": "water", "雷": "thunder", "氷": "ice", "龍": "dragon"}


def _write_csv(path: Path, fieldnames: list[str], rows: list[dict]) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    print(f"  wrote {path} ({len(rows)} rows)")


def seed_skills(json_file: Path, skills_csv: Path, effects_csv: Path) -> None:
    skills = json.loads(json_file.read_text(encoding="utf-8"))
    skill_rows = []
    effect_rows = []
    for s in skills:
        app = s.get("applicability", {})
        skill_rows.append({
            "id": s["id"],
            "name": s["name"],
            "max_level": s["maxLevel"],
            "category": s.get("category", "normal"),
            "description": s.get("description", ""),
            "require_hitzone_physical": app.get("requireHitzonePhysical", ""),
            "require_tags": "|".join(app.get("requireTags", [])),
            "match_any": "true" if app.get("matchAny") else "",
            "require_damage_type": "|".join(app.get("requireDamageType", [])),
        })
        for eff in s.get("effects", []):
            effect_rows.append({
                "skill_id": s["id"],
                "level": eff["level"],
                "attack_bonus": eff.get("attackBonus", ""),
                "affinity_bonus": eff.get("affinityBonus", ""),
                "crit_multiplier": eff.get("critMultiplier", ""),
                "element_multiplier": eff.get("elementMultiplier", ""),
                "attack_multiplier": eff.get("attackMultiplier", ""),
                "physical_multiplier": eff.get("physicalMultiplier", ""),
            })
    _write_csv(skills_csv, [
        "id", "name", "max_level", "category", "description",
        "require_hitzone_physical", "require_tags", "match_any", "require_damage_type",
    ], skill_rows)
    _write_csv(effects_csv, [
        "skill_id", "level", "attack_bonus", "affinity_bonus", "crit_multiplier",
        "element_multiplier", "attack_multiplier", "physical_multiplier",
    ], effect_rows)


def seed_monsters(json_file: Path, monsters_csv: Path) -> None:
    monsters = json.loads(json_file.read_text(encoding="utf-8"))
    rows = []
    for m in monsters:
        variant_ids = {v["id"]: v["defenseRateMod"] for v in m.get("variants", [])}
        for part in m.get("parts", []):
            elem = part.get("element", {})
            enraged_elem = part.get("enragedElement", {})
            row = {
                "monster_id": m["id"],
                "monster_name": m["name"],
                "base_defense_rate": m["baseDefenseRate"],
                "variant_normal_mod": variant_ids.get("normal", "1.0"),
                "variant_veteran_mod": variant_ids.get("veteran", ""),
                "variant_apex_mod": variant_ids.get("apex", ""),
                "part_id": part["id"],
                "part_name": part["name"],
                "physical": part["physical"],
                "fire": elem.get("火", ""),
                "water": elem.get("水", ""),
                "thunder": elem.get("雷", ""),
                "ice": elem.get("氷", ""),
                "dragon": elem.get("龍", ""),
                "wounded_physical_bonus": part.get("woundedPhysicalBonus", ""),
                "enraged_physical": part.get("enragedPhysical", ""),
                "enraged_fire": enraged_elem.get("火", ""),
                "enraged_water": enraged_elem.get("水", ""),
                "enraged_thunder": enraged_elem.get("雷", ""),
                "enraged_ice": enraged_elem.get("氷", ""),
                "enraged_dragon": enraged_elem.get("龍", ""),
            }
            rows.append(row)
    _write_csv(monsters_csv, [
        "monster_id", "monster_name", "base_defense_rate",
        "variant_normal_mod", "variant_veteran_mod", "variant_apex_mod",
        "part_id", "part_name", "physical",
        "fire", "water", "thunder", "ice", "dragon",
        "wounded_physical_bonus", "enraged_physical",
        "enraged_fire", "enraged_water", "enraged_thunder", "enraged_ice", "enraged_dragon",
    ], rows)


def seed_buffs(json_file: Path, buffs_csv: Path) -> None:
    buffs = json.loads(json_file.read_text(encoding="utf-8"))
    rows = []
    for b in buffs:
        rows.append({
            "id": b["id"],
            "name": b["name"],
            "category": b["category"],
            "exclusive_group": b.get("exclusiveGroup", ""),
            "attack_bonus": b.get("attackBonus", ""),
            "attack_multiplier": b.get("attackMultiplier", ""),
            "affinity_bonus": b.get("affinityBonus", ""),
        })
    _write_csv(buffs_csv, [
        "id", "name", "category", "exclusive_group",
        "attack_bonus", "attack_multiplier", "affinity_bonus",
    ], rows)


def seed_motions_v1_to_v2(json_file: Path, out_dir: Path) -> None:
    """
    v1 motions.json (isDraw: bool) → data/motions_{weapon}.csv (v2: tags列付き)
    isDraw=true  → is_draw=true, tags=draw
    isDraw=false → is_draw=false, tags=（空）
    """
    motions_data = json.loads(json_file.read_text(encoding="utf-8"))
    fieldnames = ["motion_name", "motion_value", "frames", "is_draw", "tags", "damage_type"]
    for weapon, motions in motions_data.items():
        rows = []
        for m in motions:
            is_draw = m.get("isDraw", False)
            # v1: isDraw → v2: tags に draw を追加
            existing_tags = m.get("tags", [])
            if is_draw and "draw" not in existing_tags:
                existing_tags = ["draw"] + existing_tags
            rows.append({
                "motion_name": m["motionName"],
                "motion_value": m["motionValue"],
                "frames": m["frames"],
                "is_draw": "true" if is_draw else "false",
                "tags": "|".join(existing_tags),
                "damage_type": m.get("damageType", ""),
            })
        csv_path = out_dir / f"motions_{weapon}.csv"
        _write_csv(csv_path, fieldnames, rows)


def main() -> None:
    print("Seeding data/ from public/data/ ...")

    # skills
    seed_skills(
        PUBLIC_DATA_DIR / "skills.json",
        DATA_DIR / "skills.csv",
        DATA_DIR / "skill_effects.csv",
    )
    seed_skills(
        PUBLIC_DATA_DIR / "series_skills.json",
        DATA_DIR / "series_skills.csv",
        DATA_DIR / "series_skill_effects.csv",
    )
    seed_skills(
        PUBLIC_DATA_DIR / "group_skills.json",
        DATA_DIR / "group_skills.csv",
        DATA_DIR / "group_skill_effects.csv",
    )

    # monsters
    seed_monsters(PUBLIC_DATA_DIR / "monsters.json", DATA_DIR / "monsters.csv")

    # buffs
    seed_buffs(PUBLIC_DATA_DIR / "buffs.json", DATA_DIR / "buffs.csv")

    # motions (v1 → v2)
    seed_motions_v1_to_v2(PUBLIC_DATA_DIR / "motions.json", DATA_DIR)

    print("Done.")


if __name__ == "__main__":
    main()
