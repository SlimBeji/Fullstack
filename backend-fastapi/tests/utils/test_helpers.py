from lib.utils import parse_dot_notation


def test_parse_dot_notation():
    example = {
        "address": "Fulham Road, London",
        "location.lat": 51.48180425016331,
        "location.lng": -0.19090418688755467,
    }
    expected = {
        "address": "Fulham Road, London",
        "location": {"lat": 51.48180425016331, "lng": -0.19090418688755467},
    }
    result = parse_dot_notation(example)
    assert result == expected
