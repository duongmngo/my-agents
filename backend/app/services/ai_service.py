"""
AI service for handling agent responses and streaming
"""
import asyncio
import json
import logging
from typing import AsyncGenerator, Optional, Dict, Any, List
from datetime import datetime

from app.models import Agent, Conversation, Message
from app.models.message import MessageType
from app.schemas.chat_schemas import AgentResponseChunk
from app.core.websocket import broadcast_agent_response_chunk, broadcast_agent_response_complete
from app.repositories.agent_repository import AgentRepository
from app.repositories.chat_repository import ChatRepository

logger = logging.getLogger(__name__)


class AIService:
    """Service for handling AI agent interactions and streaming responses"""
    
    def __init__(self):
        self.openai_client = None  # Will be initialized when needed
        self._initialize_openai()
        
        # Initialize repositories (they manage their own database sessions)
        self.agent_repo = AgentRepository()
        self.chat_repo = ChatRepository()
    
    def _initialize_openai(self):
        """Initialize OpenAI client"""
        try:
            import openai
            # This would be configured with API keys from environment or database
            self.openai_client = openai.AsyncOpenAI(
                api_key="your-openai-api-key"  # Should come from config
            )
        except ImportError:
            logger.error("OpenAI library not installed")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
    
    async def generate_agent_response(
        self,
        agent: Agent,
        conversation: Conversation,
        user_message: Message,
        conversation_history: List[Message],
        stream: bool = True
    ) -> Optional[Message]:
        """Generate an AI agent response"""
        if not self.openai_client:
            logger.error("OpenAI client not initialized")
            return None
        
        try:
            # Prepare the conversation context
            messages = self._prepare_conversation_context(
                agent, 
                conversation, 
                user_message, 
                conversation_history
            )
            
            if stream:
                return await self._generate_streaming_response(
                    agent, 
                    conversation, 
                    messages
                )
            else:
                return await self._generate_complete_response(
                    agent, 
                    conversation, 
                    messages
                )
                
        except Exception as e:
            logger.error(f"Error generating agent response: {e}")
            return None
    
    def _prepare_conversation_context(
        self,
        agent: Agent,
        conversation: Conversation,
        user_message: Message,
        conversation_history: List[Message]
    ) -> List[Dict[str, str]]:
        """Prepare conversation context for AI model"""
        messages = []
        
        # Add system prompt
        system_prompt = agent.get_effective_system_prompt()
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })
        
        # Add conversation history (last 20 messages to stay within token limits)
        recent_history = conversation_history[-20:] if conversation_history else []
        
        for msg in recent_history:
            if msg.is_deleted:
                continue
                
            role = "assistant" if msg.type == MessageType.AI_RESPONSE else "user"
            messages.append({
                "role": role,
                "content": msg.content or ""
            })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message.content or ""
        })
        
        return messages
    
    async def _generate_streaming_response(
        self,
        agent: Agent,
        conversation: Conversation,
        messages: List[Dict[str, str]]
    ) -> Optional[Message]:
        """Generate a streaming AI response"""
        try:
            # Create the message record first
            ai_message = Message(
                content="",  # Will be updated as we stream
                type=MessageType.AI_RESPONSE,
                conversation_id=conversation.id,
                workspace_id=conversation.workspace_id,
                ai_model=agent.ai_model,
                ai_prompt_tokens=0,  # Will be updated
                ai_completion_tokens=0  # Will be updated
            )
            
            # Save the message to get an ID
            ai_message = self.chat_repo.create_message(ai_message)
            
            # Generate streaming response
            full_content = ""
            prompt_tokens = 0
            completion_tokens = 0
            
            try:
                stream = await self.openai_client.chat.completions.create(
                    model=agent.ai_model,
                    messages=messages,
                    temperature=float(agent.temperature),
                    max_tokens=agent.max_tokens,
                    stream=True
                )
                
                async for chunk in stream:
                    if chunk.choices and len(chunk.choices) > 0:
                        delta = chunk.choices[0].delta
                        
                        if delta.content:
                            full_content += delta.content
                            
                            # Send chunk to WebSocket
                            chunk_data = AgentResponseChunk(
                                conversation_id=conversation.id,
                                message_id=ai_message.id,
                                chunk=delta.content,
                                is_final=False
                            )
                            
                            await broadcast_agent_response_chunk(
                                conversation.id, 
                                chunk_data
                            )
                        
                        # Update token counts
                        if hasattr(chunk, 'usage') and chunk.usage:
                            prompt_tokens = chunk.usage.prompt_tokens or 0
                            completion_tokens = chunk.usage.completion_tokens or 0
                
                # Update the message with final content
                ai_message.content = full_content
                ai_message.ai_prompt_tokens = prompt_tokens
                ai_message.ai_completion_tokens = completion_tokens
                
                ai_message = self.chat_repo.update_message(ai_message)
                
                # Send completion signal
                await broadcast_agent_response_complete(
                    conversation.id,
                    ai_message.id,
                    {
                        "prompt_tokens": prompt_tokens,
                        "completion_tokens": completion_tokens,
                        "total_tokens": prompt_tokens + completion_tokens
                    }
                )
                
                # Update agent statistics
                self.agent_repo.update_agent_token_usage(agent.id, prompt_tokens, completion_tokens)
                
                return ai_message
                
            except Exception as e:
                logger.error(f"Error in streaming response: {e}")
                # Update message with error content
                ai_message.content = f"Sorry, I encountered an error: {str(e)}"
                ai_message = self.chat_repo.update_message(ai_message)
                return ai_message
                
        except Exception as e:
            logger.error(f"Error creating streaming response: {e}")
            return None
    
    async def _generate_complete_response(
        self,
        agent: Agent,
        conversation: Conversation,
        messages: List[Dict[str, str]]
    ) -> Optional[Message]:
        """Generate a complete (non-streaming) AI response"""
        try:
            response = await self.openai_client.chat.completions.create(
                model=agent.ai_model,
                messages=messages,
                temperature=float(agent.temperature),
                max_tokens=agent.max_tokens
            )
            
            # Create message record
            ai_message = Message(
                content=response.choices[0].message.content,
                type=MessageType.AI_RESPONSE,
                conversation_id=conversation.id,
                workspace_id=conversation.workspace_id,
                ai_model=agent.ai_model,
                ai_prompt_tokens=response.usage.prompt_tokens if response.usage else 0,
                ai_completion_tokens=response.usage.completion_tokens if response.usage else 0
            )
            
            # Save to database
            ai_message = self.chat_repo.create_message(ai_message)
            
            # Update agent statistics
            if response.usage:
                self.agent_repo.update_agent_token_usage(
                    agent.id, 
                    response.usage.prompt_tokens, 
                    response.usage.completion_tokens
                )
            
            return ai_message
            
        except Exception as e:
            logger.error(f"Error generating complete response: {e}")
            return None
    
    async def _update_agent_stats(
        self, 
        agent: Agent, 
        prompt_tokens: int, 
        completion_tokens: int
    ):
        """Update agent statistics (deprecated - use agent_repo directly)"""
        try:
            from app.core.database import get_db
            db = next(get_db())
            
            # Refresh agent from database
            db_agent = db.query(Agent).filter(Agent.id == agent.id).first()
            if db_agent:
                db_agent.message_count += 1
                db_agent.total_tokens_used += prompt_tokens + completion_tokens
                db_agent.updated_at = datetime.utcnow()
                
                db.commit()
                
        except Exception as e:
            logger.error(f"Error updating agent stats: {e}")
    
    async def process_agent_capabilities(
        self,
        agent: Agent,
        user_message: Message,
        conversation: Conversation
    ) -> Optional[Dict[str, Any]]:
        """Process agent capabilities like web browsing, code execution, etc."""
        if not agent.capabilities:
            return None
        
        capabilities_result = {}
        
        # Web browsing capability
        if "web_browsing" in agent.capabilities:
            web_result = await self._process_web_browsing(user_message.content)
            if web_result:
                capabilities_result["web_browsing"] = web_result
        
        # Code execution capability
        if "code_execution" in agent.capabilities:
            code_result = await self._process_code_execution(user_message.content)
            if code_result:
                capabilities_result["code_execution"] = code_result
        
        # File processing capability
        if "file_processing" in agent.capabilities:
            file_result = await self._process_file_processing(user_message, conversation)
            if file_result:
                capabilities_result["file_processing"] = file_result
        
        return capabilities_result if capabilities_result else None
    
    async def _process_web_browsing(self, content: str) -> Optional[Dict[str, Any]]:
        """Process web browsing capability"""
        # This would integrate with a web browsing service
        # For now, return None
        return None
    
    async def _process_code_execution(self, content: str) -> Optional[Dict[str, Any]]:
        """Process code execution capability"""
        # This would integrate with a code execution service
        # For now, return None
        return None
    
    async def _process_file_processing(
        self, 
        message: Message, 
        conversation: Conversation
    ) -> Optional[Dict[str, Any]]:
        """Process file processing capability"""
        # This would analyze attached files
        # For now, return None
        return None


# Global AI service instance
ai_service = AIService()
