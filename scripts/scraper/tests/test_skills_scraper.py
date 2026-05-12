"""
Kiranicoスキルスクレイパーのテスト。
フィクスチャHTMLを使ってネットワークアクセスなしでテストする。
"""
from pathlib import Path
import pytest
from kiranico.skills import parse_skills_list, parse_skill_detail, parse_raw_effect

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


class TestParseRawEffect:
    def test_attack_bonus(self):
        assert parse_raw_effect("Attack +9") == {"attackBonus": 9.0}

    def test_affinity_bonus(self):
        assert parse_raw_effect("Affinity +15%") == {"affinityBonus": 15.0}

    def test_crit_multiplier(self):
        assert parse_raw_effect("Critical Multiplier 1.4x") == {"critMultiplier": 1.4}

    def test_elemental_multiplier(self):
        assert parse_raw_effect("Elemental Attack x1.10") == {"elementMultiplier": 1.1}

    def test_unknown_effect(self):
        result = parse_raw_effect("Some Unknown Effect")
        assert result == {"unknownEffect": "Some Unknown Effect"}
