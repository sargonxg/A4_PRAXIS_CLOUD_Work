from backend.agents.red_team_analyst.runner import run_red_team_analysis


def main() -> int:
    report = run_red_team_analysis(case_id="eval", owner_uid="eval-user", target_actor_id="actor-a")
    assert report.synthesized is True
    assert report.confidence <= 0.6
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
