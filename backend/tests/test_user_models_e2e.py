from backend.types.context import UserModelFields


def test_user_model_fields_accept_seed_shape():
    model = UserModelFields(
        identity="Foreign Policy Analyst",
        role="researcher",
        mandate="Track global political dynamics",
        methodology_toolkit=["ACH"],
        default_ontology_stacks={"indoPacific": ["conflict", "mediation", "humanitarian"]},
        work_ontology_id="foreign-policy-research",
    )

    assert model.work_ontology_id == "foreign-policy-research"
    assert model.default_ontology_stacks["indoPacific"][0] == "conflict"
