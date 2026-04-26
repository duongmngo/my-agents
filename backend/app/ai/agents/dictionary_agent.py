"""DictionaryAgent implementation.

This agent fetches dictionary information and collocations from two websites:
- OzDic for collocations and example sentences
- Cambridge Dictionary for English definitions and example usage

It then produces a structured response including English definitions, Vietnamese meanings,
collocations with examples, and at least 10 example sentences or phrases.
"""
from typing import List, Optional, Dict, Any, TypedDict, TYPE_CHECKING
import logging
import os
import uuid
import asyncio
from dotenv import load_dotenv

from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

from app.models import Message, Conversation
from app.models.message import MessageType
from app.services.chat_service import ChatService
from app.ai.agents.common.agent_event_types import AgentEventType, AgentStepKind
from app.ai.tools import fetch_website
from app.ai.agents.common.base_agent import BaseAgent

if TYPE_CHECKING:
    from app.ai.agents.common.agent_factory import AgentConfig

logger = logging.getLogger(__name__)

load_dotenv()


class DictionaryAgentState(TypedDict):
    conversation_id: str
    message_id: str
    user_id: str
    workspace_id: str
    user_message: str
    conversation_history: List[Dict[str, str]]
    plan: str
    needs_tools: bool
    tool_results: List[Dict[str, Any]]
    tool_outputs: List[Dict[str, Any]]
    response: str
    step_index: int


class DictionaryAgent(BaseAgent):
    """Dictionary agent that uses website fetches to answer word meaning requests."""

    def __init__(
        self,
        chat_service: ChatService,
        agent_config: Optional["AgentConfig"] = None,
        llm_name: str = "llm",
        model: str = "gpt-4o-mini",
        temperature: float = 0.5
    ):
        self.chat_service = chat_service
        self.llm_name = llm_name
        self.agent_config = agent_config

        if agent_config:
            self.model = agent_config.ai_model or model
            self.temperature = agent_config.temperature if agent_config.temperature is not None else temperature
            self.instructions = agent_config.instructions
            self.max_tokens = agent_config.max_tokens
            self.capabilities = agent_config.capabilities
            self.tools_config = agent_config.tools
            logger.info(f"Initialized DictionaryAgent with config: {agent_config.name} (model={self.model}, temp={self.temperature})")
        else:
            self.model = model
            self.temperature = temperature
            self.instructions = None
            self.max_tokens = 4000
            self.capabilities = None
            self.tools_config = None

        self.graph = None
        self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(DictionaryAgentState)
        workflow.add_node("plan", self._plan_node)
        workflow.add_node("execute_tools", self._execute_tools_node)
        workflow.add_node("generate", self._generate_node)
        workflow.add_node("finalize", self._finalize_node)

        workflow.add_edge(START, "plan")
        workflow.add_edge("plan", "execute_tools")
        workflow.add_edge("execute_tools", "generate")
        workflow.add_edge("generate", "finalize")
        workflow.add_edge("finalize", END)

        self.graph = workflow.compile()

    async def _plan_node(self, state: DictionaryAgentState) -> Dict[str, Any]:
        await self.chat_service.handle_response_events(
            conversation_id=state["conversation_id"],
            response_id=state["message_id"],
            event_type=AgentEventType.STEP,
            payload={
                "step_index": state["step_index"],
                "kind": AgentStepKind.REASONING,
                "content": f"Analyzing dictionary request for: {state['user_message'][:100]}...",
                "user_id": state["user_id"]
            }
        )

        history_context = "\n".join([
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in state["conversation_history"][-5:]
        ])

        instruction_block = ""
        if self.instructions:
            instruction_block = f"AGENT INSTRUCTIONS:\n{self.instructions}\n\n"

        planning_prompt = f"""{instruction_block}Analyze the CURRENT user message and identify the single English word the user wants definitions for.

Conversation history (chronological order - oldest to newest, for context only):
{history_context}

CURRENT user message: {state['user_message']}

You must fetch the following sources for the target word:
1. FETCH: https://ozdic.com/word/{{word}}  (for collocations and usage examples)
2. FETCH: https://dictionary.cambridge.org/dictionary/english/{{word}}  (for definitions, parts of speech, and example sentences)

If the target word is clear, output exactly these two FETCH lines with the resolved word substituted in both URLs.
If the target word is not explicit, choose the most likely dictionary word from the user message and still output the two FETCH URLs.

Only output the FETCH plan. Do not answer the question yet."""

        llm = ChatOpenAI(
            model=self.model,
            temperature=self.temperature,
            api_key=os.getenv("OPENAI_API_KEY")
        )

        plan_message = await asyncio.to_thread(
            lambda: llm.invoke([HumanMessage(content=planning_prompt)])
        )
        plan = plan_message.content if hasattr(plan_message, 'content') else str(plan_message)

        await self.chat_service.handle_response_events(
            conversation_id=state["conversation_id"],
            response_id=state["message_id"],
            event_type=AgentEventType.STEP,
            payload={
                "step_index": state["step_index"],
                "kind": AgentStepKind.PLAN,
                "content": plan,
                "user_id": state["user_id"]
            }
        )

        return {
            "plan": plan,
            "needs_tools": True,
            "tool_results": [],
            "tool_outputs": [],
            "step_index": state["step_index"] + 1
        }

    async def _execute_tools_node(self, state: DictionaryAgentState) -> Dict[str, Any]:
        try:
            tool_results = []
            plan = state["plan"]
            urls: List[str] = []
            scan_index = 0

            while True:
                fetch_pos = plan.find("FETCH:", scan_index)
                if fetch_pos == -1:
                    break
                url_start = fetch_pos + len("FETCH:")
                url_end = plan.find("\n", url_start)
                if url_end == -1:
                    url_end = len(plan)
                url = plan[url_start:url_end].strip()
                if url:
                    urls.append(url)
                scan_index = url_end

            if not urls:
                await self.chat_service.handle_response_events(
                    conversation_id=state["conversation_id"],
                    response_id=state["message_id"],
                    event_type=AgentEventType.STEP,
                    payload={
                        "step_index": state["step_index"],
                        "kind": AgentStepKind.TOOL_RESULT,
                        "content": "No FETCH URLs were found in the plan. Unable to retrieve dictionary sources.",
                        "user_id": state["user_id"]
                    }
                )
                return {"tool_results": [], "tool_outputs": [], "step_index": state["step_index"] + 1}

            for url in urls:
                await self.chat_service.handle_response_events(
                    conversation_id=state["conversation_id"],
                    response_id=state["message_id"],
                    event_type=AgentEventType.STEP,
                    payload={
                        "step_index": state["step_index"],
                        "kind": AgentStepKind.TOOL_CALL,
                        "content": f"Fetching website: {url}",
                        "tool_name": "fetch_website",
                        "tool_input": {"url": url},
                        "user_id": state["user_id"]
                    }
                )

                fetch_result = await fetch_website(url=url)
                tool_results.append({
                    "tool": "fetch_website",
                    "input": url,
                    "output": fetch_result
                })

                summary = ""
                if fetch_result.get("success"):
                    summary = f"Fetched {url} successfully ({len(fetch_result.get('content', ''))} characters)."
                else:
                    summary = f"Failed to fetch {url}: {fetch_result.get('error', 'Unknown error')}"

                await self.chat_service.handle_response_events(
                    conversation_id=state["conversation_id"],
                    response_id=state["message_id"],
                    event_type=AgentEventType.STEP,
                    payload={
                        "step_index": state["step_index"] + 1,
                        "kind": AgentStepKind.TOOL_RESULT,
                        "content": summary,
                        "tool_name": "fetch_website",
                        "user_id": state["user_id"]
                    }
                )

            return {
                "tool_results": tool_results,
                "tool_outputs": [
                    {"tool": result["tool"], "dataType": "fetch_website", "data": result["output"]}
                    for result in tool_results
                ],
                "step_index": state["step_index"] + 2
            }
        except Exception as e:
            logger.error(f"DictionaryAgent execute tools error: {e}")
            return {"tool_results": [], "tool_outputs": [], "step_index": state["step_index"] + 1}

    async def _generate_node(self, state: DictionaryAgentState) -> Dict[str, Any]:
        await self.chat_service.handle_response_events(
            conversation_id=state["conversation_id"],
            response_id=state["message_id"],
            event_type=AgentEventType.STEP,
            payload={
                "step_index": state["step_index"],
                "kind": AgentStepKind.TOOL_CALL,
                "content": "Generating the dictionary response from the fetched sources...",
                "user_id": state["user_id"]
            }
        )

        system_prompt = """You are a dictionary assistant. Use the fetched content from the specified dictionary sources to produce a concise, accurate, and well-structured answer."""
        if self.instructions:
            system_prompt = f"{system_prompt}\n\nAdditional instructions:\n{self.instructions}"

        tool_context = "\n\nFetched website contents:\n"
        for result in state.get("tool_results", []):
            output = result.get("output", {})
            tool_context += f"\nURL: {result.get('input')}\n"
            if isinstance(output, dict):
                title = output.get("title") or output.get("url")
                content = output.get("content", "")
                snippet = content[:1500] if content else ""
                tool_context += f"Title: {title}\nContent:\n{snippet}\n"

        generation_prompt = f"""Previous plan: {state['plan']}
{tool_context}
User message: {state['user_message']}

Instructions for the response:
- Provide English definitions for each part of speech found on Cambridge Dictionary.
- Provide a Vietnamese translation or explanation for each definition.
- Extract collocations from OzDic and explain each collocation in Vietnamese or English, with at least one example sentence for each.
- Provide at least 10 example sentences or phrases that show the word in context.
- If any source did not provide the requested information, say that clearly and summarize the available data.

Write the final answer in Vietnamese with English examples and definitions included."""

        llm = ChatOpenAI(
            model=self.model,
            temperature=self.temperature,
            api_key=os.getenv("OPENAI_API_KEY"),
            streaming=True
        )

        full_response = ""

        def stream_response():
            stream = llm.stream([
                HumanMessage(content=system_prompt),
                HumanMessage(content=generation_prompt)
            ])
            return list(stream)

        stream_tokens = await asyncio.to_thread(stream_response)
        for token_msg in stream_tokens:
            if hasattr(token_msg, 'content'):
                chunk = token_msg.content
                if chunk:
                    full_response += chunk
                    await self.chat_service.handle_response_events(
                        conversation_id=state["conversation_id"],
                        response_id=state["message_id"],
                        event_type=AgentEventType.TOKEN,
                        payload={
                            "chunk": chunk,
                            "is_final": False,
                            "user_id": state["user_id"]
                        }
                    )

        return {"response": full_response, "step_index": state["step_index"] + 1}

    async def _finalize_node(self, state: DictionaryAgentState) -> Dict[str, Any]:
        await self.chat_service.handle_response_events(
            conversation_id=state["conversation_id"],
            response_id=state["message_id"],
            event_type=AgentEventType.STEP,
            payload={
                "step_index": state["step_index"],
                "kind": AgentStepKind.TOOL_RESULT,
                "content": "Dictionary response ready.",
                "user_id": state["user_id"]
            }
        )
        return {"step_index": state["step_index"] + 1}

    async def generate_agent_response(
        self,
        conversation: Conversation,
        user_message: Message,
        conversation_history: Optional[List[Message]] = None,
        stream: bool = False,
        response_message_id: Optional[str] = None,
    ) -> Optional[Message]:
        message_id = response_message_id or str(uuid.uuid4())

        await self.chat_service.handle_response_events(
            conversation_id=str(conversation.id),
            response_id=message_id,
            event_type=AgentEventType.START,
            payload={
                "metadata": {
                    "model": self.model,
                    "temperature": self.temperature
                },
                "user_id": conversation.created_by
            }
        )

        history_dicts = []
        if conversation_history:
            for msg in conversation_history[-12:]:
                role = "assistant" if msg.type.value == MessageType.AI_RESPONSE.value else "user"
                history_dicts.append({"role": role, "content": msg.content or ""})

        initial_state: DictionaryAgentState = {
            "conversation_id": str(conversation.id),
            "message_id": message_id,
            "user_id": conversation.created_by,
            "workspace_id": str(conversation.workspace_id) if conversation.workspace_id else "",
            "user_message": str(user_message.content or ""),
            "conversation_history": history_dicts,
            "plan": "",
            "needs_tools": True,
            "tool_results": [],
            "tool_outputs": [],
            "response": "",
            "step_index": 0
        }

        if self.graph:
            final_state = await self.graph.ainvoke(initial_state)
        else:
            final_state = initial_state

        await self.chat_service.handle_response_events(
            conversation_id=str(conversation.id),
            response_id=message_id,
            event_type=AgentEventType.COMPLETE,
            payload={
                "content": final_state.get("response", ""),
                "metadata": {
                    "model": self.model,
                    "temperature": self.temperature,
                    "plan": final_state.get("plan", ""),
                    "tool_outputs": final_state.get("tool_outputs", [])
                },
                "workspace_id": conversation.workspace_id,
                "user_id": conversation.created_by,
                "ai_model": self.model,
                "message_id": message_id
            }
        )

        return None
