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
