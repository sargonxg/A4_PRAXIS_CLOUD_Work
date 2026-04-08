"""Gemini client — wraps google-genai SDK for Vertex AI calls.

Used as the low-level AI client by the graphify_tacitus extraction pipeline.
For new AI features, prefer the Genkit flows in ai/flows.py.
"""
from __future__ import annotations

import json

from config import get_settings
from graphify_tacitus.extract import ACO_EXTRACTION_PROMPT


class GeminiClient:
    """Async Gemini client using Vertex AI (google-genai SDK)."""

    def __init__(self, project_id: str | None = None, region: str | None = None) -> None:
        settings = get_settings()
        self._project_id = project_id or settings.gcp_project_id
        self._region = region or settings.gcp_region
        self._model = settings.gemini_model
        self._deep_model = settings.gemini_deep_model
        self._client = None

    def _get_client(self):
        if self._client is None:
            from google import genai
            self._client = genai.Client(
                vertexai=True,
                project=self._project_id,
                location=self._region,
            )
        return self._client

    async def generate(
        self,
        prompt: str,
        model: str | None = None,
        response_mime_type: str = "application/json",
    ) -> str:
        """Generate content and return the text response."""
        import asyncio
        client = self._get_client()
        used_model = model or self._model
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=used_model,
            contents=prompt,
            config={"response_mime_type": response_mime_type},
        )
        return response.text

    async def extract_aco(self, text: str, source_file: str = "") -> dict:
        """Extract ACO entities from text. Returns parsed dict."""
        prompt = f"{ACO_EXTRACTION_PROMPT}\n\nSOURCE TEXT:\n{text[:30_000]}"
        raw = await self.generate(prompt)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"nodes": [], "edges": []}
