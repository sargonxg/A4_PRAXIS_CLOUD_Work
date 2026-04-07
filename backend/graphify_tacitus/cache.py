"""Content-addressed cache for incremental processing — copied from Graphify."""
import hashlib
import json
from pathlib import Path


def content_hash(text: str) -> str:
    """SHA256 hash of text content for cache keys."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


class ExtractionCache:
    """Simple file-based cache keyed by source content hash.

    Prevents re-extracting the same source when re-running the pipeline
    with additional sources.
    """

    def __init__(self, cache_dir: str = ".praxis_cache") -> None:
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        return self.cache_dir / f"{key}.json"

    def get(self, text: str) -> dict | None:
        key = content_hash(text)
        p = self._path(key)
        if p.exists():
            return json.loads(p.read_text())
        return None

    def set(self, text: str, extraction: dict) -> None:
        key = content_hash(text)
        self._path(key).write_text(json.dumps(extraction, default=str))

    def clear(self) -> None:
        for f in self.cache_dir.glob("*.json"):
            f.unlink()
