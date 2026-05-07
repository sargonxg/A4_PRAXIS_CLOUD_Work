from __future__ import annotations

import random


def run_escalation_ladder(*, num_factions: int, mediator_strength: float, max_steps: int, seed: int) -> dict:
    rng = random.Random(seed)
    aggression = [rng.uniform(0.35, 0.75) for _ in range(num_factions)]
    trajectory: list[dict] = []

    for step in range(max_steps + 1):
        avg_aggression = sum(aggression) / len(aggression)
        ceasefire_pressure = max(0.0, 1.0 - avg_aggression)
        trajectory.append(
            {
                "step": step,
                "avg_aggression": round(avg_aggression, 4),
                "ceasefire_pressure": round(ceasefire_pressure, 4),
                "factions": [round(value, 4) for value in aggression],
            }
        )
        if step == max_steps:
            break
        next_values = []
        for index, value in enumerate(aggression):
            neighbor_mean = (aggression[index - 1] + aggression[(index + 1) % num_factions]) / 2
            grievance = rng.uniform(-0.04, 0.06)
            mediator_effect = mediator_strength * (0.08 + 0.04 * ceasefire_pressure)
            updated = value + (neighbor_mean - value) * 0.18 + grievance - mediator_effect
            next_values.append(min(1.0, max(0.0, updated)))
        aggression = next_values

    final = trajectory[-1]
    return {
        "scenario_id": "escalation_ladder_with_mediator",
        "framing": "scenario stress-test under explicit assumptions",
        "steps_run": max_steps,
        "seed": seed,
        "trajectory": trajectory,
        "summary": {
            "ceasefire_held_at_end": final["avg_aggression"] < 0.35,
            "max_aggression_step": max(trajectory, key=lambda point: point["avg_aggression"])["step"],
            "final_avg_aggression": final["avg_aggression"],
            "mediator_strength": mediator_strength,
        },
    }
