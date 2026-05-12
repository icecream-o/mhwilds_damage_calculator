"""
Kiranicoスクレイパー + CSV→JSON 変換の一括実行スクリプト。

使い方:
    # スキルのみスクレイプして CSV と JSON を更新
    python main.py skills

    # モンスターのみ
    python main.py monsters

    # 全部（スクレイプ → CSV 上書き → JSON 再生成）
    python main.py all

    # CSV → JSON 変換のみ（スクレイプしない）
    python main.py convert

NOTE:
    スクレイパーのセレクタ（kiranico/skills.py, kiranico/monsters.py）は
    実際のKiranicoページに合わせて調整が必要な場合があります。
    まず `python main.py skills` を実行して data/skills_scraped.csv を確認し、
    内容が正しければ data/skills.csv にマージしてください。
"""
import csv
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
DATA_DIR = ROOT / "data"

sys.path.insert(0, str(Path(__file__).parent))
from kiranico.fetch import fetch
from kiranico.skills import scrape_skills
from kiranico.monsters import scrape_monsters
from csv_to_json import (
    convert_skills, convert_buffs, convert_monsters, convert_motions,
    _write_json, PUBLIC_DATA_DIR,
)

BASE_URL = "https://mhwilds.kiranico.com"

SKILLS_CSV_FIELDS = [
    "id", "name", "max_level", "category", "description",
    "require_hitzone_physical", "require_tags", "match_any", "require_damage_type",
]
EFFECTS_CSV_FIELDS = [
    "skill_id", "level", "attack_bonus", "affinity_bonus", "crit_multiplier",
    "element_multiplier", "attack_multiplier", "physical_multiplier",
]
MONSTERS_CSV_FIELDS = [
    "monster_id", "monster_name", "base_defense_rate",
    "variant_normal_mod", "variant_veteran_mod", "variant_apex_mod",
    "part_id", "part_name", "physical",
    "fire", "water", "thunder", "ice", "dragon",
    "wounded_physical_bonus", "enraged_physical",
    "enraged_fire", "enraged_water", "enraged_thunder", "enraged_ice", "enraged_dragon",
]


def _write_csv(path: Path, fieldnames: list[str], rows: list[dict]) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    print(f"  wrote {path} ({len(rows)} rows)")


def run_scrape_skills() -> None:
    print("Scraping skills from Kiranico...")
    skill_rows, effect_rows = scrape_skills(fetch, BASE_URL)
    _write_csv(DATA_DIR / "skills_scraped.csv", SKILLS_CSV_FIELDS, skill_rows)
    _write_csv(DATA_DIR / "skill_effects_scraped.csv", EFFECTS_CSV_FIELDS, effect_rows)
    print("  → data/skills_scraped.csv に保存しました。")
    print("  → 内容を確認し、data/skills.csv にマージしてください。")
    print("  → 適用条件（require_tags等）は手動で設定が必要です。")


def run_scrape_monsters() -> None:
    print("Scraping monsters from Kiranico...")
    monster_rows = scrape_monsters(fetch, BASE_URL)
    _write_csv(DATA_DIR / "monsters_scraped.csv", MONSTERS_CSV_FIELDS, monster_rows)
    print("  → data/monsters_scraped.csv に保存しました。")
    print("  → variant_veteran_mod, variant_apex_mod は手動補完が必要です。")
    print("  → 怒り時肉質・傷口ボーナスも手動補完が必要です。")


def run_convert() -> None:
    print("Converting CSVs to JSON...")
    _write_json(
        convert_skills(DATA_DIR / "skills.csv", DATA_DIR / "skill_effects.csv"),
        PUBLIC_DATA_DIR / "skills.json",
    )
    _write_json(
        convert_skills(DATA_DIR / "series_skills.csv", DATA_DIR / "series_skill_effects.csv"),
        PUBLIC_DATA_DIR / "series_skills.json",
    )
    _write_json(
        convert_skills(DATA_DIR / "group_skills.csv", DATA_DIR / "group_skill_effects.csv"),
        PUBLIC_DATA_DIR / "group_skills.json",
    )
    _write_json(convert_buffs(DATA_DIR / "buffs.csv"), PUBLIC_DATA_DIR / "buffs.json")
    _write_json(convert_monsters(DATA_DIR / "monsters.csv"), PUBLIC_DATA_DIR / "monsters.json")
    _write_json(convert_motions(), PUBLIC_DATA_DIR / "motions.json")
    print("Done.")


def main() -> None:
    target = sys.argv[1] if len(sys.argv) > 1 else "help"
    if target == "skills":
        run_scrape_skills()
        run_convert()
    elif target == "monsters":
        run_scrape_monsters()
        run_convert()
    elif target == "all":
        run_scrape_skills()
        run_scrape_monsters()
        run_convert()
    elif target == "convert":
        run_convert()
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
