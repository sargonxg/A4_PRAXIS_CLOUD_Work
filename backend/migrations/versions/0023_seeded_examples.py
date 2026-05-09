"""seed v7 example cores

Revision ID: 0023_seeded_examples
Revises: 0022_ask_threads
"""
from __future__ import annotations

import json

from alembic import op
import sqlalchemy as sa

revision = "0023_seeded_examples"
down_revision = "0022_ask_threads"
branch_labels = None
depends_on = None


EXAMPLES = [
    ("situation", "Syria 2026 transition", "conflict", ["example", "situation", "conflict"], "A transition and access case for conflict analysis."),
    ("situation", "US housing access California", "governance", ["example", "situation", "governance"], "A policy access case for housing, institutions, and service delivery."),
    ("situation", "Workplace mediation", "mediation", ["example", "situation", "mediation"], "A mediation case for parties, interests, constraints, and settlement options."),
    ("situation", "Sanctions-evasion case", "economic", ["example", "situation", "economic"], "An economic-statecraft case for ownership, routing, compliance, and leverage."),
    ("situation", "Humanitarian access NES", "humanitarian", ["example", "situation", "humanitarian"], "A humanitarian access case for needs, constraints, responders, and corridors."),
    ("situation", "Governance transition Tunisia", "governance", ["example", "situation", "governance"], "A governance transition case for mandates, veto points, and coalition surfaces."),
    ("situation", "Narrative laundering case", "narrative", ["example", "situation", "narrative"], "A narrative case for frames, messengers, amplification, and fact-check paths."),
    ("situation", "Treaty interpretation case", "legal", ["example", "situation", "legal"], "A treaty case for provisions, parties, commitments, and interpretive claims."),
    ("situation", "Civilian protection pattern", "human-rights", ["example", "situation", "human-rights"], "A human-rights case for incident patterns, duty-bearers, and remedies."),
    ("situation", "Maritime security deconfliction", "security", ["example", "situation", "security"], "A security case for posture, rules, incidents, and deconfliction commitments."),
    ("team", "Mediation issue-framing rubric", "mediation", ["example", "rubric", "methodology"], "A reusable rubric for mediation issue framing and interests analysis."),
    ("team", "Source reliability methodology", "governance", ["example", "methodology", "source"], "A reusable methodology for ranking source reliability and decay risk."),
]


def upgrade() -> None:
    for kind, name, ontology_id, tags, description in EXAMPLES:
        metadata = {
            "seed": True,
            "library": "v7_examples",
            "frame": {
                "what_is_happening": description,
                "why_does_it_matter": "This example lets analysts test PRAXIS without making a real case first.",
                "what_would_change_assessment": "New sources, stakeholder positions, or timeline events.",
                "policy_question": f"What should an analyst ask first about {name}?",
            },
            "ontology_id": ontology_id,
        }
        op.execute(
            sa.text(
                """
                INSERT INTO cores (id, kind, name, description, owner_uid, ontology_id, tags, metadata, status)
                SELECT gen_random_uuid(), :kind, :name, :description, 'platform', :ontology_id, :tags, CAST(:metadata AS jsonb), 'active'
                WHERE NOT EXISTS (
                  SELECT 1 FROM cores WHERE owner_uid = 'platform' AND name = :name
                )
                """
            )
            .bindparams(sa.bindparam("tags", type_=sa.ARRAY(sa.Text())))
            .bindparams(
                kind=kind,
                name=name,
                description=description,
                ontology_id=ontology_id,
                tags=tags,
                metadata=json.dumps(metadata),
            )
        )


def downgrade() -> None:
    op.execute("DELETE FROM cores WHERE owner_uid = 'platform' AND tags @> ARRAY['example']::text[]")
