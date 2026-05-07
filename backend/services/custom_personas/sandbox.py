from __future__ import annotations

from dataclasses import dataclass

from backend.types.boardroom import PersonaSpec


@dataclass(frozen=True)
class CustomPersonaSandbox:
    persona_id: str
    allowed_tool_ids: frozenset[str]
    corpus_namespace: str

    @classmethod
    def from_spec(cls, spec: PersonaSpec) -> "CustomPersonaSandbox":
        return cls(
            persona_id=spec.id,
            allowed_tool_ids=frozenset(str(tool) for tool in spec.tools.get("proficientToolIds", [])),
            corpus_namespace=str(spec.corpus.get("namespace", "")),
        )

    def assert_tool_allowed(self, tool_id: str) -> None:
        if tool_id not in self.allowed_tool_ids:
            raise PermissionError(f"custom persona {self.persona_id} cannot invoke undeclared tool {tool_id}")

    def assert_namespace_allowed(self, namespace: str) -> None:
        if namespace != self.corpus_namespace:
            raise PermissionError(f"custom persona {self.persona_id} cannot read corpus namespace {namespace}")
