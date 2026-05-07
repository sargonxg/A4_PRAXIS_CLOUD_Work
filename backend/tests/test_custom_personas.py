from backend.routers.custom_personas import prepare_custom_persona
from backend.types.boardroom import PersonaSpec


def _spec() -> PersonaSpec:
    return PersonaSpec(
        id="custom:sudan-adviser",
        version="v0.1.0",
        displayName="Sudan Adviser",
        shortRole="Regional Adviser",
        avatar={"kind": "geometric", "shape": "hexagon", "color": "#2563eb"},
        background={
            "professionalProfile": "Workspace-authored adviser focused on Sudan mediation dynamics and field-network interpretation.",
            "credentials": ["Workspace-authored persona"],
            "yearsOfExperience": 8,
            "languages": ["English"],
        },
        expertise={
            "domains": ["Sudan mediation"],
            "frameworks": [{"name": "elite bargain mapping", "note": "Tracks bargaining incentives"}],
            "signatureQuestions": ["Who can veto implementation?", "What evidence would change the recommendation?"],
            "signatureBlindSpots": ["May overweight elite signals."],
            "confidenceProfile": "measured",
        },
        voice={
            "register": "professional",
            "typicalUtteranceLength": {"min": 35, "median": 140, "max": 360},
            "formPreferences": ["prose", "questions"],
            "signaturePhrases": ["From the workspace corpus"],
            "avoidPhrases": ["as an AI language model"],
        },
        tools={"proficientToolIds": ["cross.red-team"], "canInvokeTools": True},
        corpus={
            "namespace": "persona:custom:sudan-adviser:v0.1.0",
            "version": "v0.1.0",
            "manifest": [{"id": "source-1", "title": "Field note", "citation": "Workspace field note", "license": "workspace-restricted"}],
        },
    )


def test_prepare_custom_persona_adds_sandbox_and_prompt():
    prepared = prepare_custom_persona(_spec())

    assert prepared["sandbox"]["allowedToolIds"] == ["cross.red-team"]
    assert prepared["sandbox"]["corpusNamespace"] == "persona:custom:sudan-adviser:v0.1.0"
    assert "not privileged instruction" in prepared["systemPrompt"]
