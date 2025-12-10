"""DefaultAgent implementation (langgraph required).

This module provides a single, opinionated DefaultAgent that uses
`langgraph` to produce responses. The project relies on langgraph being
available for the default agent.

The agent exposes a `generate_agent_response` coroutine that mirrors the
shape used elsewhere in the app: it's a compact adapter that runs a
small langgraph graph (single LLM node), collects the output, and saves
the result via the application's AI service helper so chat history and
statistics are updated consistently.
"""
from typing import List, Optional
import logging

from app.models import Message, Conversation
from app.models.agent import Agent as AgentModel
from app.models.message import MessageType
from app.services.ai_service import ai_service
import langgraph  # type: ignore

logger = logging.getLogger(__name__)


from app.ai.agents.base_agent import BaseAgent


class DefaultAgent(BaseAgent):
    """Default agent runner using langgraph.

    This agent is intentionally small: it builds a one-node graph that
    forwards a composed prompt to a single LLM node and returns the
    generated text. The chat handler will persist the final output via
    the AIService helper so existing broadcasting and storage behaviour
    is reused.
    """

    def __init__(self, llm_name: str = "llm", model: str = "gpt-4", temperature: float = 0.7):
        self.llm_name = llm_name
        self.model = model
        self.temperature = temperature

    async def generate_agent_response(
        self,
        conversation: Conversation,
        user_message: Message,
        conversation_history: Optional[List[Message]] = None,
        stream: bool = False,
    ) -> Optional[Message]:
        """Run a minimal langgraph graph and save the final response.

        This implementation focuses on producing a single final reply and
        persisting it using ai_service._generate_complete_response so that
        all repo updates and broadcasting are kept consistent.
        """
        try:
            # Compose a simple prompt from the last N history items
            prompt_parts = []
            recent = (conversation_history or [])[-12:]
            for m in recent:
                role = "assistant" if m.type == MessageType.AI_RESPONSE else "user"
                prompt_parts.append(f"[{role}] {m.content or ''}")

            prompt_parts.append(f"[user] {user_message.content or ''}")
            prompt = "\n".join(prompt_parts)

            # Build a tiny graph: single LLM node into a terminal node
            Graph = langgraph.Graph
            LLM = getattr(langgraph.nodes, "LLM", None) or getattr(langgraph, "LLM", None)
            if LLM is None:
                # Langgraph installation is present but nodes API differs — try fallback
                logger.debug("langgraph LLM helper not found; attempting generic run")

            graph = Graph(name="default-agent-graph")

            # Create LLM node with model + temperature if available
            try:
                llm_node = LLM(name=self.llm_name, model=self.model, temperature=self.temperature)
            except Exception:
                # Try alternate constructor shapes
                llm_node = LLM(name=self.llm_name, model=self.model)

            graph.add_node(llm_node)

            # Run the graph. Many langgraph runtimes allow async APIs.
            # Use the most compatible API surface: prefer run_async if present.
            run_func = getattr(graph, "run_async", None) or getattr(graph, "run", None)

            if run_func is None:
                raise RuntimeError("langgraph graph has no runnable method")

            result = await run_func(prompt=prompt) if getattr(run_func, "__name__", "").endswith("async") else run_func(prompt=prompt)

            # Interpret result: support dict-like or plain text
            if isinstance(result, dict):
                text = result.get("output") or result.get("text") or result.get("result") or ""
            else:
                text = str(result)

            # Persist using AIService helper so DB & broadcasts are consistent
            messages = []
            # Reuse AIService message builder shape
            if conversation_history:
                for m in recent:
                    role = "assistant" if m.type == MessageType.AI_RESPONSE else "user"
                    messages.append({"role": role, "content": m.content or ""})

            messages.append({"role": "user", "content": user_message.content or ""})
            messages.append({"role": "assistant", "content": text})

            saved = await ai_service._generate_complete_response(
                agent=self._to_agent_model(),
                conversation=conversation,
                messages=messages,
            )

            return saved

        except Exception as e:
            logger.exception("DefaultAgent(langgraph) failed: %s", e)
            return None

    def _to_agent_model(self) -> AgentModel:
        """Return a transient AgentModel used by ai_service helpers."""
        a = AgentModel()
        try:
            a.id = getattr(self, "llm_name", "default-agent")
            a.name = "default-agent"
            a.ai_model = self.model
            a.temperature = str(self.temperature)
            a.max_tokens = 2000
            a.is_active = True
        except Exception:
            pass
        return a
