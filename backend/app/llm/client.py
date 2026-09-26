import asyncio
import json
import logging

import httpx
from pydantic import ValidationError

from app.core.config import settings
from app.llm.prompts import SYSTEM_PROMPT, build_reasoning_prompt
from app.llm.schemas import ReasoningRequest, ReasoningResponse


logger = logging.getLogger(__name__)


class GeminiClient:

    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.model = settings.gemini_model

    async def reason(self, request: ReasoningRequest) -> ReasoningResponse:

        if not self.api_key:
            return self._fallback_reasoning(
                request,
                "GEMINI_API_KEY is not configured."
            )

        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent"
        )

        payload = {
            "system_instruction": {
                "parts": [
                    {
                        "text": SYSTEM_PROMPT
                    }
                ]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": build_reasoning_prompt(
                                request.model_dump()
                            )
                        }
                    ],
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json",
            },
        }

        headers = {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json",
        }

        last_error = None

        for attempt in range(2):

            try:

                async with httpx.AsyncClient(timeout=25.0) as client:

                    response = await client.post(
                        url,
                        headers=headers,
                        json=payload,
                    )

                logger.info("Gemini reasoning returned HTTP %s", response.status_code)

                if response.status_code in (429, 500, 502, 503, 504):

                    last_error = (
                        f"Gemini temporary error "
                        f"{response.status_code}: "
                        f"{response.text}"
                    )

                    if attempt < 1:
                        await asyncio.sleep(1)
                        continue

                    return self._fallback_reasoning(
                        request,
                        last_error
                    )

                if response.is_error:
                    return self._fallback_reasoning(
                        request,
                        f"Gemini request failed with HTTP {response.status_code}.",
                    )

                result = response.json()

                try:
                    text = (
                        result["candidates"][0]
                        ["content"]["parts"][0]["text"]
                    )

                    data = json.loads(text)

                except (KeyError, IndexError, json.JSONDecodeError) as exc:

                    return self._fallback_reasoning(
                        request,
                        f"Invalid Gemini reasoning response: {exc}"
                    )

                try:
                    return ReasoningResponse.model_validate(data)
                except ValidationError as exc:
                    return self._fallback_reasoning(
                        request,
                        f"Gemini response did not match the reasoning schema: {exc}",
                    )

            except httpx.HTTPError as exc:

                last_error = str(exc)

                if attempt < 1:
                    await asyncio.sleep(1)
                    continue

                return self._fallback_reasoning(
                    request,
                    last_error
                )

        return self._fallback_reasoning(
            request,
            last_error or "Unknown Gemini error"
        )

    def _fallback_reasoning(
        self,
        request: ReasoningRequest,
        error: str,
    ) -> ReasoningResponse:

        evidence = []

        if request.industry_demand is not None:
            evidence.append(
                f"Industry demand is {request.industry_demand:.2f}."
            )

        if request.curriculum_coverage is not None:
            evidence.append(
                f"Curriculum coverage is "
                f"{request.curriculum_coverage:.2f}."
            )

        if request.candidate_readiness is not None:
            evidence.append(
                f"Candidate readiness is "
                f"{request.candidate_readiness:.3f}."
            )

        if request.gap_score is not None:
            evidence.append(
                f"Recorded gap score is "
                f"{request.gap_score:.4f}."
            )

        actions = []

        if request.priority in {"HIGH", "CRITICAL"}:
            actions.append(
                "Prioritize workforce upskilling for this skill."
            )

        if (
            request.curriculum_coverage is not None
            and request.curriculum_coverage < 0.80
        ):
            actions.append(
                "Review and strengthen curriculum coverage."
            )

        if (
            request.candidate_readiness is not None
            and request.candidate_readiness < 0.60
        ):
            actions.append(
                "Consider targeted candidate skill development."
            )

        if not actions:
            actions.append(
                "Continue monitoring the available evidence."
            )

        return ReasoningResponse(
            skill=request.skill,
            summary=(
                f"{request.skill} has a recorded priority of "
                f"{request.priority or 'UNSPECIFIED'} based on the "
                f"available SKILLVERSE evidence."
            ),
            evidence=evidence,
            recommended_actions=actions[:3],
            rationale=(
                "This decision brief was generated from the "
                "deterministic SKILLVERSE evidence because the "
                "LLM reasoning service was temporarily unavailable."
            ),
            confidence="medium",
        )
