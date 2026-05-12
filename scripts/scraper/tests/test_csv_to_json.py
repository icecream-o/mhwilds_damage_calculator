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
