import csv
import pytest
from pathlib import Path
from csv_to_json import convert_skills, convert_buffs, convert_monsters


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
