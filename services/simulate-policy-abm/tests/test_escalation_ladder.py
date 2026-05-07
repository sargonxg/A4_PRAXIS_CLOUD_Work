import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scenarios.escalation_ladder_with_mediator import run_escalation_ladder


def test_escalation_ladder_is_deterministic():
    first = run_escalation_ladder(num_factions=5, mediator_strength=0.5, max_steps=30, seed=42)
    second = run_escalation_ladder(num_factions=5, mediator_strength=0.5, max_steps=30, seed=42)

    assert first == second
    assert first["framing"] == "scenario stress-test under explicit assumptions"
    assert len(first["trajectory"]) == 31
