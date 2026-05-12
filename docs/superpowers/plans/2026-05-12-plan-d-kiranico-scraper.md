# Kiranico Data Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kiranicoからスキル・モンスター肉質データをスクレイピングし、`data/*.csv` に保存、`scripts/scraper/csv_to_json.py` で `public/data/*.json` に変換するパイプラインを構築する。

**Architecture:** CSV ファイルが唯一の正規データソースとなり、`public/data/*.json` は常に CSV から生成される。既存の `public/data/*.json` は `seed_from_json.py` で CSV に逆変換してブートストラップする。Kiranico スクレイパーは実行ごとにHTMLをキャッシュして再実行可能とする。

**Tech Stack:** Python 3.11+, requests, BeautifulSoup4, pandas (CSV読み書き), pytest

---

## ファイル構成

```
data/                                   # CSV原本（git管理、手動編集可能）
├── skills.csv                          # スキルマスター（通常）
├── skill_effects.csv                   # スキル効果Lv別
├── series_skills.csv                   # シリーズスキル
├── series_skill_effects.csv
├── group_skills.csv                    # グループスキル
├── group_skill_effects.csv
├── monsters.csv                        # モンスター肉質（1行=monster×part）
├── motions_longsword.csv               # 太刀モーション（v2タグ形式）
└── buffs.csv                           # バフマスター

scripts/scraper/
├── pytest.ini                          # pythonpath=. でテスト用import設定
├── requirements.txt
├── csv_to_json.py                      # CSV → public/data/*.json 変換（メイン）
├── seed_from_json.py                   # 既存JSONをCSVに逆変換（初回ブートストラップ用）
├── main.py                             # 一括実行: スクレイプ → CSV → JSON
├── kiranico/
│   ├── __init__.py
│   ├── fetch.py                        # HTTPキャッシュ付きフェッチ（1秒レート制限）
│   ├── skills.py                       # スキルページパーサー → CSV行
│   └── monsters.py                    # モンスター肉質ページパーサー → CSV行
└── tests/
    ├── conftest.py
    ├── fixtures/
    │   ├── skills_page.html            # Kiranicoスキル一覧ページのスナップショット
    │   ├── skill_detail.html           # 個別スキルページのスナップショット
    │   └── monster_page.html          # モンスター肉質ページのスナップショット
    ├── test_csv_to_json.py
    ├── test_skills_scraper.py
    └── test_monsters_scraper.py
```

## CSV スキーマ（全タスクの参照元）

### data/skills.csv / series_skills.csv / group_skills.csv
```
id,name,max_level,category,description,require_hitzone_physical,require_tags,match_any,require_damage_type
```
- `require_tags`: パイプ区切り `draw|jump` or 空
- `match_any`: `true` / `false` or 空（デフォルト false = AND）
- `require_damage_type`: パイプ区切り or 空

### data/skill_effects.csv / series_skill_effects.csv / group_skill_effects.csv
```
skill_id,level,attack_bonus,affinity_bonus,crit_multiplier,element_multiplier,attack_multiplier,physical_multiplier
```
空セル = そのフィールドはJSONに出力しない。

### data/monsters.csv（1行 = モンスター×部位）
```
monster_id,monster_name,base_defense_rate,variant_normal_mod,variant_veteran_mod,variant_apex_mod,part_id,part_name,physical,fire,water,thunder,ice,dragon,wounded_physical_bonus,enraged_physical,enraged_fire,enraged_water,enraged_thunder,enraged_ice,enraged_dragon
```
- `variant_veteran_mod` / `variant_apex_mod`: 空なら出力しない
- 元素列（fire, water 等）: 空 = そのJSON出力しない
- 変換時: `fire→火, water→水, thunder→雷, ice→氷, dragon→龍`

### data/motions_{weapon_type}.csv
```
motion_name,motion_value,frames,is_draw,tags,damage_type
```
- `tags`: パイプ区切り or 空
- `damage_type`: 空 = physical
- `weapon_type`: longsword, greatsword, dualblades, swordshield, hammer, huntinghorn, lance, gunlance, switchaxe, chargeblade, insectglaive, bow, lightbowgun, heavybowgun

### data/buffs.csv
```
id,name,category,exclusive_group,attack_bonus,attack_multiplier,affinity_bonus
```

---

## Task 1: Python環境セットアップ

**Files:**
- Create: `scripts/scraper/requirements.txt`
- Create: `scripts/scraper/pytest.ini`
- Create: `scripts/scraper/kiranico/__init__.py`
- Modify: `.gitignore`

- [ ] **Step 1: ディレクトリを作成**

```bash
mkdir -p data
mkdir -p scripts/scraper/kiranico
mkdir -p scripts/scraper/tests/fixtures
```

- [ ] **Step 2: requirements.txt を作成**

`scripts/scraper/requirements.txt`:
```
requests==2.32.3
beautifulsoup4==4.13.4
lxml==5.3.2
pytest==8.3.5
```

- [ ] **Step 3: pytest.ini を作成**

`scripts/scraper/pytest.ini`:
```ini
[pytest]
pythonpath = .
testpaths = tests
```

- [ ] **Step 4: `__init__.py` を作成**

```bash
touch scripts/scraper/kiranico/__init__.py
```

- [ ] **Step 5: .gitignore に追記**

`.gitignore` の末尾に追記:
```
# Python scraper
scripts/scraper/cache/
__pycache__/
.pytest_cache/
*.pyc
```

- [ ] **Step 6: 依存パッケージをインストール**

```bash
pip install -r scripts/scraper/requirements.txt
```

Expected: Successfully installed requests-2.32.3 beautifulsoup4-4.13.4 lxml-5.3.2 pytest-8.3.5 (バージョンは近い値でもOK)

- [ ] **Step 7: Commit**

```bash
git add scripts/ data/.gitkeep .gitignore
git commit -m "chore(scraper): python environment setup for kiranico pipeline"
```

Note: `data/` ディレクトリは git add できないので、`.gitkeep` を置く:
```bash
touch data/.gitkeep
```

---

## Task 2: csv_to_json.py — スキル変換（TDD）

**Files:**
- Create: `scripts/scraper/csv_to_json.py`
- Test: `scripts/scraper/tests/test_csv_to_json.py`

- [ ] **Step 1: テストを書く**

`scripts/scraper/tests/test_csv_to_json.py`:

```python
import csv
import pytest
from pathlib import Path
from csv_to_json import convert_skills, convert_buffs


def write_csv(tmp_path: Path, name: str, rows: list[dict]) -> Path:
    f = tmp_path / name
    if not rows:
        f.write_text("", encoding="utf-8")
        return f
    with open(f, "w", newline="", encoding="utf-8") as fp:
        w = csv.DictWriter(fp, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    return f


SKILL_ROW_DEFAULTS = {
    "id": "", "name": "", "max_level": "1", "category": "normal",
    "description": "", "require_hitzone_physical": "",
    "require_tags": "", "match_any": "", "require_damage_type": "",
}

EFFECT_ROW_DEFAULTS = {
    "skill_id": "", "level": "1",
    "attack_bonus": "", "affinity_bonus": "", "crit_multiplier": "",
    "element_multiplier": "", "attack_multiplier": "", "physical_multiplier": "",
}


class TestConvertSkillsBasic:
    def test_basic_skill_no_applicability(self, tmp_path):
        sf = write_csv(tmp_path, "skills.csv", [{
            **SKILL_ROW_DEFAULTS,
            "id": "attack", "name": "攻撃", "max_level": "5",
            "description": "攻撃力アップ",
        }])
        ef = write_csv(tmp_path, "effects.csv", [
            {**EFFECT_ROW_DEFAULTS, "skill_id": "attack", "level": "1", "attack_bonus": "3"},
            {**EFFECT_ROW_DEFAULTS, "skill_id": "attack", "level": "5", "attack_bonus": "9"},
        ])
        result = convert_skills(sf, ef)
        assert len(result) == 1
        skill = result[0]
        assert skill["id"] == "attack"
        assert skill["name"] == "攻撃"
        assert skill["maxLevel"] == 5
        assert skill["category"] == "normal"
        assert skill["description"] == "攻撃力アップ"
        assert "applicability" not in skill
        assert skill["effects"] == [
            {"level": 1, "attackBonus": 3.0},
            {"level": 5, "attackBonus": 9.0},
        ]

    def test_crit_multiplier_effect(self, tmp_path):
        sf = write_csv(tmp_path, "skills.csv", [{
            **SKILL_ROW_DEFAULTS, "id": "critical-boost", "name": "超会心",
            "max_level": "3",
        }])
        ef = write_csv(tmp_path, "effects.csv", [
            {**EFFECT_ROW_DEFAULTS, "skill_id": "critical-boost",
             "level": "3", "crit_multiplier": "1.40"},
        ])
        result = convert_skills(sf, ef)
        assert result[0]["effects"][0] == {"level": 3, "critMultiplier": 1.40}

    def test_multiple_skills(self, tmp_path):
        sf = write_csv(tmp_path, "skills.csv", [
            {**SKILL_ROW_DEFAULTS, "id": "attack", "name": "攻撃", "max_level": "5"},
            {**SKILL_ROW_DEFAULTS, "id": "critical-eye", "name": "見切り", "max_level": "7"},
        ])
        ef = write_csv(tmp_path, "effects.csv", [
            {**EFFECT_ROW_DEFAULTS, "skill_id": "attack", "level": "1", "attack_bonus": "3"},
            {**EFFECT_ROW_DEFAULTS, "skill_id": "critical-eye", "level": "7", "affinity_bonus": "30"},
        ])
        result = convert_skills(sf, ef)
        assert len(result) == 2
        assert result[0]["id"] == "attack"
        assert result[1]["id"] == "critical-eye"


class TestConvertSkillsApplicability:
    def test_hitzone_applicability(self, tmp_path):
        sf = write_csv(tmp_path, "skills.csv", [{
            **SKILL_ROW_DEFAULTS,
            "id": "weakness-exploit", "name": "弱点特効", "max_level": "3",
            "require_hitzone_physical": "45",
        }])
        ef = write_csv(tmp_path, "effects.csv", [
            {**EFFECT_ROW_DEFAULTS, "skill_id": "weakness-exploit",
             "level": "3", "affinity_bonus": "30"},
        ])
        result = convert_skills(sf, ef)
        assert result[0]["applicability"] == {"requireHitzonePhysical": 45}

    def test_tag_applicability(self, tmp_path):
        sf = write_csv(tmp_path, "skills.csv", [{
            **SKILL_ROW_DEFAULTS,
            "id": "punishing-draw", "name": "抜刀術【技】", "max_level": "3",
            "require_tags": "draw",
        }])
        ef = write_csv(tmp_path, "effects.csv", [
            {**EFFECT_ROW_DEFAULTS, "skill_id": "punishing-draw",
             "level": "1", "affinity_bonus": "10"},
        ])
        result = convert_skills(sf, ef)
        assert result[0]["applicability"] == {"requireTags": ["draw"]}

    def test_tag_applicability_match_any(self, tmp_path):
        sf = write_csv(tmp_path, "skills.csv", [{
            **SKILL_ROW_DEFAULTS,
            "id": "aerial-skill", "name": "飛燕", "max_level": "3",
            "require_tags": "jump|aerial", "match_any": "true",
        }])
        ef = write_csv(tmp_path, "effects.csv", [
            {**EFFECT_ROW_DEFAULTS, "skill_id": "aerial-skill",
             "level": "3", "affinity_bonus": "20"},
        ])
        result = convert_skills(sf, ef)
        assert result[0]["applicability"] == {
            "requireTags": ["jump", "aerial"], "matchAny": True
        }

    def test_damage_type_applicability(self, tmp_path):
        sf = write_csv(tmp_path, "skills.csv", [{
            **SKILL_ROW_DEFAULTS,
            "id": "artillery", "name": "砲術", "max_level": "3",
            "require_damage_type": "shell-normal|shell-spread|shell-long",
        }])
        ef = write_csv(tmp_path, "effects.csv", [
            {**EFFECT_ROW_DEFAULTS, "skill_id": "artillery",
             "level": "3", "physical_multiplier": "1.30"},
        ])
        result = convert_skills(sf, ef)
        assert result[0]["applicability"] == {
            "requireDamageType": ["shell-normal", "shell-spread", "shell-long"]
        }
        assert result[0]["effects"][0] == {"level": 3, "physicalMultiplier": 1.30}


class TestConvertBuffs:
    def test_buff_with_exclusive_group(self, tmp_path):
        bf = write_csv(tmp_path, "buffs.csv", [
            {"id": "demon-drug-g", "name": "鬼人薬グレート", "category": "item",
             "exclusive_group": "atk-up-large", "attack_bonus": "7",
             "attack_multiplier": "", "affinity_bonus": ""},
            {"id": "demon-drug", "name": "鬼人薬", "category": "item",
             "exclusive_group": "atk-up-large", "attack_bonus": "5",
             "attack_multiplier": "", "affinity_bonus": ""},
        ])
        result = convert_buffs(bf)
        assert len(result) == 2
        assert result[0]["exclusiveGroup"] == "atk-up-large"
        assert result[0]["attackBonus"] == 7.0
        assert "attackMultiplier" not in result[0]

    def test_buff_attack_multiplier(self, tmp_path):
        bf = write_csv(tmp_path, "buffs.csv", [
            {"id": "horn-atk-l", "name": "笛 攻撃力UP【大】", "category": "horn",
             "exclusive_group": "horn-atk", "attack_bonus": "",
             "attack_multiplier": "1.15", "affinity_bonus": ""},
        ])
        result = convert_buffs(bf)
        assert result[0]["attackMultiplier"] == 1.15
        assert "attackBonus" not in result[0]

    def test_buff_no_exclusive_group(self, tmp_path):
        bf = write_csv(tmp_path, "buffs.csv", [
            {"id": "powercharm", "name": "力の護符", "category": "item",
             "exclusive_group": "", "attack_bonus": "6",
             "attack_multiplier": "", "affinity_bonus": ""},
        ])
        result = convert_buffs(bf)
        assert "exclusiveGroup" not in result[0]
        assert result[0]["attackBonus"] == 6.0
```

- [ ] **Step 2: テスト失敗を確認**

```bash
cd scripts/scraper && python -m pytest tests/test_csv_to_json.py -v
```

Expected: `ModuleNotFoundError: No module named 'csv_to_json'`

- [ ] **Step 3: csv_to_json.py を実装（スキル + バフ変換）**

`scripts/scraper/csv_to_json.py`:

```python
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
```

- [ ] **Step 4: テスト成功を確認**

```bash
cd scripts/scraper && python -m pytest tests/test_csv_to_json.py -v
```

Expected: 全テスト PASS（`NotImplementedError` を返す関数はまだ呼ばれていないので問題なし）

- [ ] **Step 5: Commit**

```bash
git add scripts/scraper/csv_to_json.py scripts/scraper/tests/test_csv_to_json.py
git commit -m "feat(scraper): csv_to_json skill+buff converters with TDD"
```

---

## Task 3: csv_to_json.py — モンスター変換（TDD）

**Files:**
- Modify: `scripts/scraper/csv_to_json.py` (convert_monsters を実装)
- Test: `scripts/scraper/tests/test_csv_to_json.py` (モンスターテストを追記)

- [ ] **Step 1: テストを追記**

`scripts/scraper/tests/test_csv_to_json.py` の末尾に追記:

```python
from csv_to_json import convert_monsters

MONSTER_ROW_DEFAULTS = {
    "monster_id": "", "monster_name": "", "base_defense_rate": "1.0",
    "variant_normal_mod": "1.0", "variant_veteran_mod": "0.95",
    "variant_apex_mod": "0.85",
    "part_id": "", "part_name": "",
    "physical": "0",
    "fire": "", "water": "", "thunder": "", "ice": "", "dragon": "",
    "wounded_physical_bonus": "", "enraged_physical": "",
    "enraged_fire": "", "enraged_water": "", "enraged_thunder": "",
    "enraged_ice": "", "enraged_dragon": "",
}


class TestConvertMonsters:
    def test_single_monster_single_part(self, tmp_path):
        mf = write_csv(tmp_path, "monsters.csv", [{
            **MONSTER_ROW_DEFAULTS,
            "monster_id": "gore-magala", "monster_name": "ゴア・マガラ",
            "base_defense_rate": "1.0",
            "variant_normal_mod": "1.0", "variant_veteran_mod": "0.95",
            "variant_apex_mod": "0.85",
            "part_id": "head", "part_name": "頭部",
            "physical": "85", "water": "35", "thunder": "15",
        }])
        result = convert_monsters(mf)
        assert len(result) == 1
        m = result[0]
        assert m["id"] == "gore-magala"
        assert m["name"] == "ゴア・マガラ"
        assert m["baseDefenseRate"] == 1.0
        assert len(m["variants"]) == 3
        assert m["variants"][0] == {"id": "normal", "name": "通常", "defenseRateMod": 1.0}
        assert m["variants"][1] == {"id": "veteran", "name": "歴戦", "defenseRateMod": 0.95}
        assert m["variants"][2] == {"id": "apex", "name": "護竜", "defenseRateMod": 0.85}
        assert len(m["parts"]) == 1
        part = m["parts"][0]
        assert part["id"] == "head"
        assert part["name"] == "頭部"
        assert part["physical"] == 85
        assert part["element"] == {"水": 35, "雷": 15}
        assert "woundedPhysicalBonus" not in part
        assert "enragedPhysical" not in part

    def test_monster_with_wounded_and_enraged(self, tmp_path):
        mf = write_csv(tmp_path, "monsters.csv", [{
            **MONSTER_ROW_DEFAULTS,
            "monster_id": "gore-magala", "monster_name": "ゴア・マガラ",
            "part_id": "head", "part_name": "頭部",
            "physical": "85", "water": "35",
            "wounded_physical_bonus": "10",
            "enraged_physical": "90", "enraged_water": "40",
        }])
        result = convert_monsters(mf)
        part = result[0]["parts"][0]
        assert part["woundedPhysicalBonus"] == 10
        assert part["enragedPhysical"] == 90
        assert part["enragedElement"] == {"水": 40}

    def test_monster_multiple_parts_grouped(self, tmp_path):
        mf = write_csv(tmp_path, "monsters.csv", [
            {**MONSTER_ROW_DEFAULTS,
             "monster_id": "gore-magala", "monster_name": "ゴア・マガラ",
             "part_id": "head", "part_name": "頭部", "physical": "85"},
            {**MONSTER_ROW_DEFAULTS,
             "monster_id": "gore-magala", "monster_name": "ゴア・マガラ",
             "part_id": "body", "part_name": "胴体", "physical": "50"},
        ])
        result = convert_monsters(mf)
        assert len(result) == 1  # 1モンスター
        assert len(result[0]["parts"]) == 2

    def test_monster_no_apex_variant(self, tmp_path):
        mf = write_csv(tmp_path, "monsters.csv", [{
            **MONSTER_ROW_DEFAULTS,
            "monster_id": "test-monster", "monster_name": "テストモンスター",
            "variant_normal_mod": "1.0", "variant_veteran_mod": "0.95",
            "variant_apex_mod": "",  # 護竜なし
            "part_id": "head", "part_name": "頭部", "physical": "70",
        }])
        result = convert_monsters(mf)
        assert len(result[0]["variants"]) == 2
        assert result[0]["variants"][-1]["id"] == "veteran"
```

- [ ] **Step 2: テスト失敗を確認**

```bash
cd scripts/scraper && python -m pytest tests/test_csv_to_json.py::TestConvertMonsters -v
```

Expected: `FAIL — NotImplementedError`

- [ ] **Step 3: convert_monsters を実装**

`scripts/scraper/csv_to_json.py` の `convert_monsters` を差し替え:

```python
def convert_monsters(monsters_file: Path) -> list:
    """monsters.csv → monsters.json の要素リスト"""
    ELEMENT_COLS = ["fire", "water", "thunder", "ice", "dragon"]
    ENRAGED_COLS = ["enraged_fire", "enraged_water", "enraged_thunder",
                    "enraged_ice", "enraged_dragon"]

    monsters: dict[str, dict] = {}
    with open(monsters_file, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            mid = row["monster_id"]
            if mid not in monsters:
                variants = [
                    {"id": "normal", "name": "通常",
                     "defenseRateMod": float(row["variant_normal_mod"])}
                ]
                if v := row.get("variant_veteran_mod", "").strip():
                    variants.append({"id": "veteran", "name": "歴戦",
                                     "defenseRateMod": float(v)})
                if v := row.get("variant_apex_mod", "").strip():
                    variants.append({"id": "apex", "name": "護竜",
                                     "defenseRateMod": float(v)})
                monsters[mid] = {
                    "id": mid,
                    "name": row["monster_name"],
                    "baseDefenseRate": float(row["base_defense_rate"]),
                    "variants": variants,
                    "parts": [],
                }

            # 部位
            part: dict = {
                "id": row["part_id"],
                "name": row["part_name"],
                "physical": int(row["physical"]),
                "element": {},
            }
            for col in ELEMENT_COLS:
                if v := _int_or_none(row.get(col, "")):
                    part["element"][ELEMENT_NAME_MAP[col]] = v

            if v := _int_or_none(row.get("wounded_physical_bonus", "")):
                part["woundedPhysicalBonus"] = v
            if v := _int_or_none(row.get("enraged_physical", "")):
                part["enragedPhysical"] = v

            enraged_elem: dict = {}
            for col in ENRAGED_COLS:
                elem_key = col.replace("enraged_", "")
                if v := _int_or_none(row.get(col, "")):
                    enraged_elem[ELEMENT_NAME_MAP[elem_key]] = v
            if enraged_elem:
                part["enragedElement"] = enraged_elem

            monsters[mid]["parts"].append(part)

    return list(monsters.values())
```

- [ ] **Step 4: テスト成功を確認**

```bash
cd scripts/scraper && python -m pytest tests/test_csv_to_json.py::TestConvertMonsters -v
```

Expected: 全テスト PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/scraper/csv_to_json.py scripts/scraper/tests/test_csv_to_json.py
git commit -m "feat(scraper): csv_to_json monster converter with TDD"
```

---

## Task 4: csv_to_json.py — モーション変換（TDD）

**Files:**
- Modify: `scripts/scraper/csv_to_json.py` (convert_motions を実装)
- Test: `scripts/scraper/tests/test_csv_to_json.py` (モーションテストを追記)

- [ ] **Step 1: テストを追記**

`scripts/scraper/tests/test_csv_to_json.py` の末尾に追記:

```python
from csv_to_json import convert_motions

MOTION_ROW_DEFAULTS = {
    "motion_name": "", "motion_value": "0", "frames": "0",
    "is_draw": "false", "tags": "", "damage_type": "",
}


class TestConvertMotions:
    def test_basic_motion_no_tags(self, tmp_path, monkeypatch):
        # DATA_DIRをtmp_pathに差し替える
        import csv_to_json
        monkeypatch.setattr(csv_to_json, "DATA_DIR", tmp_path)

        write_csv(tmp_path, "motions_longsword.csv", [
            {**MOTION_ROW_DEFAULTS,
             "motion_name": "縦斬り", "motion_value": "22", "frames": "28"},
        ])
        result = convert_motions()
        assert "longsword" in result
        motions = result["longsword"]
        assert len(motions) == 1
        m = motions[0]
        assert m["motionName"] == "縦斬り"
        assert m["motionValue"] == 22
        assert m["frames"] == 28
        assert m["isDraw"] is False
        assert "tags" not in m
        assert "damageType" not in m

    def test_draw_motion_with_tag(self, tmp_path, monkeypatch):
        import csv_to_json
        monkeypatch.setattr(csv_to_json, "DATA_DIR", tmp_path)

        write_csv(tmp_path, "motions_longsword.csv", [
            {**MOTION_ROW_DEFAULTS,
             "motion_name": "居合抜刀気刃斬り", "motion_value": "70",
             "frames": "50", "is_draw": "true", "tags": "draw"},
        ])
        result = convert_motions()
        m = result["longsword"][0]
        assert m["isDraw"] is True
        assert m["tags"] == ["draw"]

    def test_gunlance_shell_motion(self, tmp_path, monkeypatch):
        import csv_to_json
        monkeypatch.setattr(csv_to_json, "DATA_DIR", tmp_path)

        write_csv(tmp_path, "motions_gunlance.csv", [
            {**MOTION_ROW_DEFAULTS,
             "motion_name": "通常砲撃Lv1", "motion_value": "20",
             "frames": "40", "is_draw": "false",
             "tags": "", "damage_type": "shell-normal"},
        ])
        result = convert_motions()
        assert "gunlance" in result
        m = result["gunlance"][0]
        assert m["damageType"] == "shell-normal"

    def test_missing_weapon_csv_is_skipped(self, tmp_path, monkeypatch):
        import csv_to_json
        monkeypatch.setattr(csv_to_json, "DATA_DIR", tmp_path)
        # longsword 以外のCSVが存在しない場合は出力しない
        write_csv(tmp_path, "motions_longsword.csv", [
            {**MOTION_ROW_DEFAULTS,
             "motion_name": "縦斬り", "motion_value": "22", "frames": "28"},
        ])
        result = convert_motions()
        assert set(result.keys()) == {"longsword"}
```

- [ ] **Step 2: テスト失敗を確認**

```bash
cd scripts/scraper && python -m pytest tests/test_csv_to_json.py::TestConvertMotions -v
```

Expected: `FAIL — NotImplementedError`

- [ ] **Step 3: convert_motions を実装**

`scripts/scraper/csv_to_json.py` の `convert_motions` を差し替え:

```python
def convert_motions() -> dict:
    """motions_{weapon}.csv → motions.json の辞書"""
    result: dict[str, list] = {}
    for weapon in WEAPON_TYPES:
        csv_file = DATA_DIR / f"motions_{weapon}.csv"
        if not csv_file.exists():
            continue
        motions = []
        with open(csv_file, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                motion: dict = {
                    "motionName": row["motion_name"],
                    "motionValue": int(row["motion_value"]),
                    "frames": int(row["frames"]),
                    "isDraw": row.get("is_draw", "false").strip().lower() == "true",
                }
                if tags := _tags(row.get("tags", "")):
                    motion["tags"] = tags
                if dt := row.get("damage_type", "").strip():
                    motion["damageType"] = dt
                motions.append(motion)
        result[weapon] = motions
    return result
```

- [ ] **Step 4: テスト成功を確認**

```bash
cd scripts/scraper && python -m pytest tests/test_csv_to_json.py -v
```

Expected: 全テスト PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/scraper/csv_to_json.py scripts/scraper/tests/test_csv_to_json.py
git commit -m "feat(scraper): csv_to_json motion converter with TDD"
```

---

## Task 5: seed_from_json.py — 既存JSONからCSV初期データ生成

**Files:**
- Create: `scripts/scraper/seed_from_json.py`

既存の `public/data/*.json` を読んで `data/*.csv` を生成する。これで「最初のCSVは人力で作らなくていい」状態にする。

- [ ] **Step 1: seed_from_json.py を作成**

`scripts/scraper/seed_from_json.py`:

```python
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
```

- [ ] **Step 2: seed_from_json.py を実行してCSVを生成**

```bash
cd scripts/scraper && python seed_from_json.py
```

Expected output:
```
Seeding data/ from public/data/ ...
  wrote .../data/skills.csv (14 rows)
  wrote .../data/skill_effects.csv (N rows)
  wrote .../data/series_skills.csv (2 rows)
  ...
  wrote .../data/motions_longsword.csv (8 rows)
Done.
```

- [ ] **Step 3: 生成されたCSVの内容を確認**

```bash
head -5 data/skills.csv
```

Expected:
```
id,name,max_level,category,description,require_hitzone_physical,require_tags,match_any,require_damage_type
attack,攻撃,5,normal,攻撃力アップ,,,,
critical-eye,見切り,7,normal,会心率アップ,,,,
```

```bash
head -5 data/monsters.csv
```

Expected:
```
monster_id,monster_name,base_defense_rate,...
gore-magala,ゴア・マガラ,1.0,1.0,0.95,0.85,head,頭部,85,,,15,,,10,90,,,20,,
```

```bash
head -5 data/motions_longsword.csv
```

Expected:
```
motion_name,motion_value,frames,is_draw,tags,damage_type
縦斬り,22,28,false,,
踏み込み斬り,26,30,false,,
...
居合抜刀気刃斬り,70,50,true,draw,
```

- [ ] **Step 4: Commit**

```bash
git add scripts/scraper/seed_from_json.py data/
git commit -m "feat(scraper): seed_from_json converts existing JSON to CSV (v1 motions → v2 tags)"
```

---

## Task 6: public/data 全再生成 + motions.json v2移行

**Files:**
- Modify: `public/data/motions.json` (isDraw のみ → isDraw + tags 両フィールド)
- Modify: `public/data/skills.json`, `series_skills.json`, `group_skills.json`, `monsters.json`, `buffs.json` (再生成)

CSVが正規データソースになったことを確認するため、全 JSON を CSV から再生成する。

- [ ] **Step 1: csv_to_json.py で全ファイルを再生成**

```bash
cd scripts/scraper && python csv_to_json.py
```

Expected:
```
  wrote .../public/data/skills.json
  wrote .../public/data/series_skills.json
  wrote .../public/data/group_skills.json
  wrote .../public/data/buffs.json
  wrote .../public/data/monsters.json
  wrote .../public/data/motions.json
```

- [ ] **Step 2: 再生成された motions.json を確認（isDraw + tags 両方あること）**

```bash
node -e "const m = require('./public/data/motions.json'); console.log(JSON.stringify(m.longsword[6], null, 2))"
```

Expected（居合抜刀気刃斬り）:
```json
{
  "motionName": "居合抜刀気刃斬り",
  "motionValue": 70,
  "frames": 50,
  "isDraw": true,
  "tags": ["draw"]
}
```

- [ ] **Step 3: 既存のアプリテストが全て通ること**

```bash
npm run test:run
```

Expected: 39 passed (39 total)

- [ ] **Step 4: ビルドが通ること**

```bash
npm run build
```

Expected: `✓ built in ...ms`

- [ ] **Step 5: Commit**

```bash
git add public/data/ data/
git commit -m "feat(data): regenerate all JSON from CSV; motions.json migrated to v2 tags format"
```

---

## Task 7: HTTPフェッチユーティリティ + Kiranicoスキルスクレイパー（TDD）

**Files:**
- Create: `scripts/scraper/kiranico/fetch.py`
- Create: `scripts/scraper/tests/fixtures/skills_page.html`
- Create: `scripts/scraper/tests/fixtures/skill_detail.html`
- Create: `scripts/scraper/tests/test_skills_scraper.py`
- Create: `scripts/scraper/kiranico/skills.py`

- [ ] **Step 1: fetch.py を作成**

`scripts/scraper/kiranico/fetch.py`:

```python
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
```

- [ ] **Step 2: フィクスチャHTMLを作成**

Kiranicoのスキル一覧ページ（`/skills`）は下記のような構造を持つ。
実際のサイトの構造とズレがある場合は、後の Step でセレクタを修正する。

`scripts/scraper/tests/fixtures/skills_page.html`:

```html
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>Skills - MH Wilds Kiranico</title></head>
<body>
<div class="container">
  <table class="table">
    <thead>
      <tr><th>Name</th><th>Levels</th><th>Description</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><a href="/skills/1">攻撃</a></td>
        <td>5</td>
        <td>攻撃力アップ</td>
      </tr>
      <tr>
        <td><a href="/skills/2">見切り</a></td>
        <td>7</td>
        <td>会心率アップ</td>
      </tr>
      <tr>
        <td><a href="/skills/3">弱点特効</a></td>
        <td>3</td>
        <td>物理肉質45以上で会心率UP</td>
      </tr>
    </tbody>
  </table>
</div>
</body>
</html>
```

`scripts/scraper/tests/fixtures/skill_detail.html`（スキル個別ページ例: 攻撃Lv1-5）:

```html
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>攻撃 - MH Wilds Kiranico</title></head>
<body>
<div class="container">
  <h1>攻撃</h1>
  <table class="table">
    <thead>
      <tr><th>Level</th><th>Effect</th></tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>Attack +3</td></tr>
      <tr><td>2</td><td>Attack +5</td></tr>
      <tr><td>3</td><td>Attack +6</td></tr>
      <tr><td>4</td><td>Attack +7</td></tr>
      <tr><td>5</td><td>Attack +9</td></tr>
    </tbody>
  </table>
</div>
</body>
</html>
```

- [ ] **Step 3: テストを書く**

`scripts/scraper/tests/test_skills_scraper.py`:

```python
"""
Kiranicoスキルスクレイパーのテスト。
フィクスチャHTMLを使ってネットワークアクセスなしでテストする。
"""
from pathlib import Path
import pytest
from kiranico.skills import parse_skills_list, parse_skill_detail

FIXTURES = Path(__file__).parent / "fixtures"


class TestParseSkillsList:
    def test_parses_all_skills(self):
        html = (FIXTURES / "skills_page.html").read_text(encoding="utf-8")
        skills = parse_skills_list(html)
        assert len(skills) == 3

    def test_first_skill_fields(self):
        html = (FIXTURES / "skills_page.html").read_text(encoding="utf-8")
        skills = parse_skills_list(html)
        first = skills[0]
        assert first["name"] == "攻撃"
        assert first["maxLevel"] == 5
        assert first["description"] == "攻撃力アップ"
        assert first["detailPath"] == "/skills/1"

    def test_skill_with_max_level_7(self):
        html = (FIXTURES / "skills_page.html").read_text(encoding="utf-8")
        skills = parse_skills_list(html)
        mitakiri = next(s for s in skills if s["name"] == "見切り")
        assert mitakiri["maxLevel"] == 7


class TestParseSkillDetail:
    def test_parses_effects_by_level(self):
        html = (FIXTURES / "skill_detail.html").read_text(encoding="utf-8")
        effects = parse_skill_detail(html)
        assert len(effects) == 5

    def test_first_effect(self):
        html = (FIXTURES / "skill_detail.html").read_text(encoding="utf-8")
        effects = parse_skill_detail(html)
        assert effects[0] == {"level": 1, "rawEffect": "Attack +3"}

    def test_last_effect(self):
        html = (FIXTURES / "skill_detail.html").read_text(encoding="utf-8")
        effects = parse_skill_detail(html)
        assert effects[4] == {"level": 5, "rawEffect": "Attack +9"}
```

Note: `parse_skill_detail` は rawEffect（文字列）を返す。攻撃系・会心系の数値抽出は `skills.py` 内の別関数が行う。

- [ ] **Step 4: テスト失敗を確認**

```bash
cd scripts/scraper && python -m pytest tests/test_skills_scraper.py -v
```

Expected: `FAIL — No module named 'kiranico.skills'`

- [ ] **Step 5: kiranico/skills.py を実装**

`scripts/scraper/kiranico/skills.py`:

```python
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
    # スキル一覧テーブルのtbody > tr を探す
    # Kiranicoでセレクタが異なる場合: soup.select("table tbody tr") を調整
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
        rawEffect は "Attack +3" など Kiranico の表示文字列をそのまま返す。
        数値変換は scrape_skills() 内で行う。
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
    認識できないフォーマットは {"unknownEffect": raw} として保存する。

    Examples:
        "Attack +9"               → {"attackBonus": 9}
        "Affinity +15%"           → {"affinityBonus": 15}
        "Critical Multiplier 1.4x"→ {"critMultiplier": 1.4}
        "Elemental Attack x1.10"  → {"elementMultiplier": 1.1}
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


def scrape_skills(fetch_fn, base_url: str = "https://mhwilds.kiranico.com") -> list[dict]:
    """
    Kiranicoからスキル一覧と詳細を取得し、skills.csv 形式の行リストを返す。

    Args:
        fetch_fn: fetch(url) → html str を返す関数（fetch.pyのfetchを渡す）
        base_url: KiranicoのベースURL

    Returns:
        (skill_rows, effect_rows) タプル
        skill_rows: skills.csv の行辞書リスト
        effect_rows: skill_effects.csv の行辞書リスト
    """
    list_html = fetch_fn(f"{base_url}/skills")
    skills = parse_skills_list(list_html)

    skill_rows = []
    effect_rows = []
    for s in skills:
        skill_id = s["detailPath"].rstrip("/").split("/")[-1]
        # 数字IDをスラッグに変換（例: "1" → "skill-1"）
        # 実際のサイトでスラッグが確認できれば更新する
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
```

- [ ] **Step 6: テスト成功を確認**

```bash
cd scripts/scraper && python -m pytest tests/test_skills_scraper.py -v
```

Expected: 全テスト PASS

- [ ] **Step 7: Commit**

```bash
git add scripts/scraper/kiranico/fetch.py \
        scripts/scraper/kiranico/skills.py \
        scripts/scraper/tests/test_skills_scraper.py \
        scripts/scraper/tests/fixtures/
git commit -m "feat(scraper): kiranico skills scraper with fixture-based TDD"
```

---

## Task 8: Kiranicoモンスタースクレイパー + main.py + v0.3.0-plan-d

**Files:**
- Create: `scripts/scraper/tests/fixtures/monster_page.html`
- Create: `scripts/scraper/tests/test_monsters_scraper.py`
- Create: `scripts/scraper/kiranico/monsters.py`
- Create: `scripts/scraper/main.py`

- [ ] **Step 1: モンスターフィクスチャHTMLを作成**

`scripts/scraper/tests/fixtures/monster_page.html`（ゴア・マガラ個別ページ例）:

```html
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>Gore Magala - MH Wilds Kiranico</title></head>
<body>
<div class="container">
  <h1>ゴア・マガラ</h1>
  <!-- 肉質テーブル -->
  <table class="table" id="physiology">
    <thead>
      <tr>
        <th>Part</th>
        <th>Sever</th>
        <th>Blunt</th>
        <th>Ranged</th>
        <th>Fire</th>
        <th>Water</th>
        <th>Ice</th>
        <th>Thunder</th>
        <th>Dragon</th>
        <th>Stagger</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>頭部</td>
        <td>85</td><td>80</td><td>70</td>
        <td>5</td><td>35</td><td>0</td><td>15</td><td>0</td>
        <td>200</td>
      </tr>
      <tr>
        <td>胴体</td>
        <td>50</td><td>45</td><td>40</td>
        <td>5</td><td>20</td><td>0</td><td>10</td><td>0</td>
        <td>150</td>
      </tr>
    </tbody>
  </table>
</div>
</body>
</html>
```

Note: Kiranicoの実際のテーブル構造（列の順番、「Sever」or「Cut」等の表記）は実際のページで確認して調整する。

- [ ] **Step 2: テストを書く**

`scripts/scraper/tests/test_monsters_scraper.py`:

```python
from pathlib import Path
from kiranico.monsters import parse_monster_page

FIXTURES = Path(__file__).parent / "fixtures"


class TestParseMonsterPage:
    def setup_method(self):
        self.html = (FIXTURES / "monster_page.html").read_text(encoding="utf-8")

    def test_parses_all_parts(self):
        parts = parse_monster_page(self.html)
        assert len(parts) == 2

    def test_first_part_name(self):
        parts = parse_monster_page(self.html)
        assert parts[0]["part_name"] == "頭部"

    def test_first_part_physical(self):
        parts = parse_monster_page(self.html)
        # Sever (斬) 列を物理肉質として使用
        assert parts[0]["physical"] == 85

    def test_first_part_elements(self):
        parts = parse_monster_page(self.html)
        p = parts[0]
        assert p["fire"] == 5
        assert p["water"] == 35
        assert p["thunder"] == 15
        assert p["ice"] == 0
        assert p["dragon"] == 0

    def test_second_part(self):
        parts = parse_monster_page(self.html)
        p = parts[1]
        assert p["part_name"] == "胴体"
        assert p["physical"] == 50
        assert p["water"] == 20
```

- [ ] **Step 3: テスト失敗を確認**

```bash
cd scripts/scraper && python -m pytest tests/test_monsters_scraper.py -v
```

Expected: `FAIL — No module named 'kiranico.monsters'`

- [ ] **Step 4: kiranico/monsters.py を実装**

`scripts/scraper/kiranico/monsters.py`:

```python
"""
Kiranicoモンスター肉質ページのパーサー。
フィクスチャHTMLをもとに構築。実際のサイトの列順や表記が異なる場合は
parse_monster_page のロジックを調整する。
"""
from bs4 import BeautifulSoup


# Kiranicoの物理肉質列インデックス（Sever=1, Blunt=2, Ranged=3）
# MH Wilds版で列が変わっている場合は下記を更新する
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
        値が "-" または "0" の場合も数値として返す。
    """
    soup = BeautifulSoup(html, "lxml")
    result = []
    # 肉質テーブルを探す（id="physiology" または最初のtable）
    table = soup.find("table", {"id": "physiology"}) or soup.find("table")
    if not table:
        return result

    rows = table.find("tbody").find_all("tr") if table.find("tbody") else []
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


def scrape_monsters(fetch_fn, base_url: str = "https://mhwilds.kiranico.com") -> tuple[list, list]:
    """
    Kiranicoからモンスター一覧と肉質データを取得し、monsters.csv 形式の行リストを返す。

    Returns:
        monster_rows: monsters.csv の行辞書リスト
    """
    # モンスター一覧ページからスラッグリストを取得
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
                "variant_veteran_mod": "",   # スクレイパーでは取得不可 → 手動で補完
                "variant_apex_mod": "",       # 同上
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
```

- [ ] **Step 5: テスト成功を確認**

```bash
cd scripts/scraper && python -m pytest tests/test_monsters_scraper.py -v
```

Expected: 全テスト PASS

- [ ] **Step 6: 全テストを実行**

```bash
cd scripts/scraper && python -m pytest -v
```

Expected: 全テスト PASS

- [ ] **Step 7: main.py を作成（一括実行エントリーポイント）**

`scripts/scraper/main.py`:

```python
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

# インポート
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
    # 上書きせず _scraped suffix で保存（手動マージを推奨）
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
```

- [ ] **Step 8: main.py の動作確認（convert モード）**

スクレイプなしで変換のみ実行する（ネットワーク不要）:

```bash
cd scripts/scraper && python main.py convert
```

Expected:
```
Converting CSVs to JSON...
  wrote .../public/data/skills.json
  wrote .../public/data/series_skills.json
  wrote .../public/data/group_skills.json
  wrote .../public/data/buffs.json
  wrote .../public/data/monsters.json
  wrote .../public/data/motions.json
Done.
```

- [ ] **Step 9: アプリテストが全て通ること**

```bash
npm run test:run && npm run build
```

Expected: 39 passed, ビルド成功

- [ ] **Step 10: Commit + タグ**

```bash
git add scripts/scraper/ data/
git commit -m "feat(scraper): kiranico monsters scraper + main.py pipeline runner"
git tag v0.3.0-plan-d
```

---

## 付録: Kiranicoセレクタの調整方法

スクレイパーを実際に動かす前に、以下の手順でセレクタを確認する:

```bash
# スキル一覧ページを取得（キャッシュに保存される）
python -c "
from kiranico.fetch import fetch
html = fetch('https://mhwilds.kiranico.com/skills')
with open('/tmp/skills_check.html', 'w') as f: f.write(html)
print('saved to /tmp/skills_check.html')
"
```

ブラウザで `/tmp/skills_check.html` を開いて、テーブルの構造を確認する。
`parse_skills_list` の `soup.select("table tbody tr")` が正しいか確認する。

モンスターページも同様:
```bash
python -c "
from kiranico.fetch import fetch
html = fetch('https://mhwilds.kiranico.com/monsters/gore-magala')
with open('/tmp/gore_check.html', 'w') as f: f.write(html)
print('saved to /tmp/gore_check.html')
"
```

セレクタを修正したら、フィクスチャHTMLも実際のHTMLに合わせて更新し、テストが通ることを確認する。
