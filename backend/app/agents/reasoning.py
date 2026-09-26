from app.llm.client import GeminiClient
from app.llm.schemas import ReasoningRequest, ReasoningResponse


class ReasoningAgent:

    def __init__(self):
        self.client = GeminiClient()

    async def run(self, evidence: dict) -> ReasoningResponse:
        request = ReasoningRequest.model_validate(evidence)
        return await self.client.reason(request)
