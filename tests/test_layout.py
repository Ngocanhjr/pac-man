from pathlib import Path

import pytest

from backend.game.layout import load_layout, parse_layout


MAPS_DIR = Path(__file__).parents[1] / "backend" / "maps"


def test_tiny_is_a_closed_5_by_5_demo_map():
    text = (MAPS_DIR / "tiny.txt").read_text(encoding="utf-8")
    lines = text.splitlines()

    assert len(lines) == 5
    assert {len(line) for line in lines} == {5}
    assert set(text) <= {"%", "P", ".", "\n"}
    assert text.count("P") == 1

    state = load_layout("tiny")
    assert state.width == state.height == 5
    assert state.food


@pytest.mark.parametrize(
    ("text", "message"),
    [
        ("%%%%%\n%P.%\n%%%%%", "cùng chiều rộng"),
        ("%%%%%\n%...%\n%%%%%", "đúng một ký tự 'P'"),
        ("%%%%%\n%PP.%\n%%%%%", "đúng một ký tự 'P'"),
        ("%%%%%\n%P..%\n%%.%%", "Viền ngoài phải kín"),
    ],
)
def test_parse_layout_rejects_invalid_layout(text, message):
    with pytest.raises(ValueError, match=message):
        parse_layout(text)


@pytest.mark.parametrize("name", ["tiny", "small", "medium", "classic"])
def test_bundled_maps_are_rectangular_and_parseable(name):
    state = load_layout(name)
    assert state.width > 0 and state.height > 0
