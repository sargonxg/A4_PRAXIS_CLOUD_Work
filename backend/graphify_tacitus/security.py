"""Security utilities — URL validation, label sanitization — copied from Graphify."""
import re
from urllib.parse import urlparse


_SAFE_SCHEMES = {"http", "https"}
_LABEL_MAX_LEN = 500
_DISALLOWED_PATTERN = re.compile(r"[<>\"'`;\\]")


def validate_url(url: str) -> bool:
    """Return True if URL uses http/https and has a valid hostname."""
    try:
        parsed = urlparse(url)
        return parsed.scheme in _SAFE_SCHEMES and bool(parsed.netloc)
    except Exception:
        return False


def sanitize_label(label: str) -> str:
    """Strip characters that could cause issues in Neo4j/HTML contexts."""
    sanitized = _DISALLOWED_PATTERN.sub("", label)
    return sanitized[:_LABEL_MAX_LEN].strip()


def validate_path(path: str, allowed_prefix: str) -> bool:
    """Ensure a file path stays within the allowed directory (path traversal prevention)."""
    import os
    normalized = os.path.normpath(os.path.join(allowed_prefix, path))
    return normalized.startswith(os.path.normpath(allowed_prefix))
