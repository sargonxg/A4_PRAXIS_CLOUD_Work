"""Nightly yente index sync placeholder.

The production job should run inside the yente deployment boundary. This script
keeps the PRAXIS ops contract explicit without pulling data during CI.
"""
from __future__ import annotations

import os


def index_manifest_url() -> str:
    return os.getenv("OPENSANCTIONS_MANIFEST_URL", "https://data.opensanctions.org/datasets/latest/index.json")


if __name__ == "__main__":
    print(f"OpenSanctions public archive manifest: {index_manifest_url()}")
