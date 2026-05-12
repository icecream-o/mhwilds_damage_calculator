"""
CSV → public/data/*.json 変換スクリプト

使い方:
    python csv_to_json.py          # 全ファイルを変換
    python csv_to_json.py skills   # スキルのみ
"""
import csv
import json
import sys
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).parent.parent.parent
DATA_DIR = ROOT / "data"
PUBLIC_DATA_DIR = ROOT / "public" / "data"

ELEMENT_NAME_MAP = {
    "fire": "火", "water": "水", "thunder": "雷", "ice": "氷", "dragon": "龍",
}

WEAPON_TYPES = [
    "longsword", "greatsword", "dualblades", "swordshield",
    "hammer", "huntinghorn", "lance", "gunlance",
    "switchaxe", "chargeblade", "insectglaive",
    "bow", "lightbowgun", "heavybowgun",
]

SKILL_EFFECT_FIELD_MAP = {
    "attack_bonus": "attackBonus",
    "affinity_bonus": "affinityBonus",
    "crit_multiplier": "critMultiplier",
    "element_multiplier": "elementMultiplier",
    "attack_multiplier": "attackMultiplier",
    "physical_multiplier": "physicalMultiplier",
}

BUFF_FIELD_MAP = {
    "attack_bonus": "attackBonus",
    "attack_multiplier": "attackMultiplier",
    "affinity_bonus": "affinityBonus",
}


def _float_or_none(v: str) -> Optional[float]:
    v = v.strip()
    return float(v) if v else None


def _int_or_none(v: str) -> Optional[int]:
    v = v.strip()
    return int(v) if v else None


def _tags(v: str) -> list[str]:
    return [t.strip() for t in v.split("|") if t.strip()]


def convert_skills(skills_file: Path, effects_file: Path) -> list:
    """skills.csv + skill_effects.csv → skills.json の要素リスト"""
    # 先にeffectsをskill_idでグループ化
    effects: dict[str, list] = {}
    with open(effects_file, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            sid = row["skill_id"]
            eff: dict = {"level": int(row["level"])}
            for csv_field, json_field in SKILL_EFFECT_FIELD_MAP.items():
                v = _float_or_none(row.get(csv_field, ""))
                if v is not None:
                    eff[json_field] = v
            effects.setdefault(sid, []).append(eff)

    result = []
    with open(skills_file, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            skill: dict = {
                "id": row["id"],
                "name": row["name"],
                "maxLevel": int(row["max_level"]),
                "category": row["category"],
                "effects": effects.get(row["id"], []),
            }
            if desc := row.get("description", "").strip():
                skill["description"] = desc

            # applicability の構築
            app: dict = {}
            if v := _int_or_none(row.get("require_hitzone_physical", "")):
                app["requireHitzonePhysical"] = v
            if tags := _tags(row.get("require_tags", "")):
                app["requireTags"] = tags
                if row.get("match_any", "").strip() == "true":
                    app["matchAny"] = True
            if dt := _tags(row.get("require_damage_type", "")):
                app["requireDamageType"] = dt
            if app:
                skill["applicability"] = app

            result.append(skill)
    return result


def convert_buffs(buffs_file: Path) -> list:
    """buffs.csv → buffs.json の要素リスト"""
    result = []
    with open(buffs_file, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            buff: dict = {
                "id": row["id"],
                "name": row["name"],
                "category": row["category"],
            }
            if eg := row.get("exclusive_group", "").strip():
                buff["exclusiveGroup"] = eg
            for csv_field, json_field in BUFF_FIELD_MAP.items():
                if v := _float_or_none(row.get(csv_field, "")):
                    buff[json_field] = v
            result.append(buff)
    return result


def convert_monsters(monsters_file: Path) -> list:
    """monsters.csv → monsters.json の要素リスト（Task 3 で実装）"""
    raise NotImplementedError


def convert_motions() -> dict:
    """motions_{weapon}.csv → motions.json の辞書（Task 4 で実装）"""
    raise NotImplementedError


def _write_json(data: object, output_file: Path) -> None:
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  wrote {output_file}")


def main(targets: list[str] | None = None) -> None:
    all_targets = targets or ["skills", "series", "group", "buffs", "monsters", "motions"]

    if "skills" in all_targets:
        data = convert_skills(
            DATA_DIR / "skills.csv", DATA_DIR / "skill_effects.csv"
        )
        _write_json(data, PUBLIC_DATA_DIR / "skills.json")

    if "series" in all_targets:
        data = convert_skills(
            DATA_DIR / "series_skills.csv", DATA_DIR / "series_skill_effects.csv"
        )
        _write_json(data, PUBLIC_DATA_DIR / "series_skills.json")

    if "group" in all_targets:
        data = convert_skills(
            DATA_DIR / "group_skills.csv", DATA_DIR / "group_skill_effects.csv"
        )
        _write_json(data, PUBLIC_DATA_DIR / "group_skills.json")

    if "buffs" in all_targets:
        data = convert_buffs(DATA_DIR / "buffs.csv")
        _write_json(data, PUBLIC_DATA_DIR / "buffs.json")

    if "monsters" in all_targets:
        data = convert_monsters(DATA_DIR / "monsters.csv")
        _write_json(data, PUBLIC_DATA_DIR / "monsters.json")

    if "motions" in all_targets:
        data = convert_motions()
        _write_json(data, PUBLIC_DATA_DIR / "motions.json")


if __name__ == "__main__":
    targets = sys.argv[1:] or None
    main(targets)
