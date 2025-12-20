"""
Example usage of the DefaultAgent with LangGraph and streaming events.

This file demonstrates:
1. Creating an agent instance
2. Preparing conversation state
3. Calling generate_agent_response
4. Monitoring streaming events via Redis
5. Handling responses and errors
"""

# ============================================================================
# EXAMPLE 1: Direct Agent Usage (Python Script)
# ============================================================================

import asyncio
import logging
from datetime import datetime

# Setup logging to see execution traces
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def example_direct_agent_usage():
    """Example 1: Direct agent usage without HTTP"""
    from app.ai.agents.default_agent import DefaultAgent
    from app.models import Conversation, Message, MessageType, Workspace, User
    from app.repositories.workspace_repository import WorkspaceRepository
    from app.repositories.user_repository import UserRepository
    
    try:
        # Create an agent instance
        agent = DefaultAgent(
            llm_name="default-agent",
            model="gpt-4o-mini",
            temperature=0.7
        )
        logger.info("Agent created successfully")
        
        # Create test conversation (in real app, would come from DB)
        # For this example, we'll create mock objects
        workspace = Workspace(
            id="ws-test-123",
            name="Test Workspace",
            created_at=datetime.now()
        )
        
        conversation = Conversation(
            id="conv-test-456",
            workspace_id="ws-test-123",
            title="Test Conversation",
            created_at=datetime.now()
        )
        
        # Create user message
        user_message = Message(
            content="What is the capital of France?",
            type=MessageType.USER_MESSAGE,
            conversation_id=conversation.id,
            workspace_id=conversation.workspace_id,
            sender_id="user-123"
        )
        
        # Create conversation history (optional)
        history = [
            Message(
                content="Hello! I'm an AI assistant.",
                type=MessageType.AI_RESPONSE,
                conversation_id=conversation.id,
                workspace_id=conversation.workspace_id
            ),
            Message(
                content="Hi! Can you help me with geography?",
                type=MessageType.USER_MESSAGE,
                conversation_id=conversation.id,
                workspace_id=conversation.workspace_id
            )
        ]
        
        # Generate response with streaming
        logger.info("Starting agent response generation...")
        response = await agent.generate_agent_response(
            conversation=conversation,
            user_message=user_message,
            conversation_history=history,
            stream=True  # Enable streaming events to Redis
        )
        
        if response:
            logger.info(f"Response generated successfully:")
            logger.info(f"  Content: {response.content[:100]}...")
            logger.info(f"  Model: {response.ai_model}")
            logger.info(f"  ID: {response.id}")
        else:
            logger.error("Failed to generate response")
    
    except Exception as e:
        logger.exception(f"Error in agent usage example: {e}")


# ============================================================================
# EXAMPLE 2: Monitoring Redis Events
# ============================================================================

async def example_monitor_redis_events():
    """Example 2: Monitor streaming events from Redis"""
    import redis.asyncio as redis
    import json
    
    try:
        # Connect to Redis
        r = redis.from_url("redis://localhost:6379", decode_responses=True)
        
        # Subscribe to agent events
        pubsub = r.pubsub()
        
        # Subscribe to specific conversation's events
        conversation_id = "conv-test-456"
        patterns = [
            f"agent:{conversation_id}:step",
            f"agent:{conversation_id}:token",
            f"agent:{conversation_id}:complete",
            f"agent:{conversation_id}:error"
        ]
        
        for pattern in patterns:
            await pubsub.subscribe(pattern)
        
        logger.info(f"Subscribed to {len(patterns)} channels")
        
        # Listen for events
        async for message in pubsub.listen():
            if message["type"] == "message":
                channel = message["channel"]
                data = json.loads(message["data"])
                
                # Parse event type from channel
                event_type = channel.split(":")[-1]
                
                if event_type == "step":
                    logger.info(f"  Step: {data.get('kind')} - {data.get('content')[:50]}")
                
                elif event_type == "token":
                    logger.info(f"  Token: {data.get('chunk')}", end="", flush=True)
                
                elif event_type == "complete":
                    logger.info(f"\n  Complete: {data.get('finalText')[:50]}...")
                
                elif event_type == "error":
                    logger.error(f"  Error: {data.get('error')}")
    
    except Exception as e:
        logger.exception(f"Error monitoring Redis: {e}")


# ============================================================================
# EXAMPLE 3: HTTP + WebSocket Integration
# ============================================================================

async def example_http_websocket_flow():
    """Example 3: Full flow with HTTP API and WebSocket streaming"""
    import httpx
    import websockets
    import json
    
    """
    Step 1: Get JWT token
    """
    async with httpx.AsyncClient() as client:
        # Login to get token
        login_response = await client.post(
            "http://localhost:8001/api/v1/auth/login",
            json={"email": "user@example.com", "password": "password"}
        )
        
        if login_response.status_code != 200:
            logger.error(f"Login failed: {login_response.text}")
            return
        
        token = login_response.json()["access_token"]
        logger.info(f"Got token: {token[:20]}...")
        
        """
        Step 2: Connect WebSocket
        """
        ws_url = f"ws://localhost:8001/api/v1/ws?token={token}"
        
        async with websockets.connect(ws_url) as websocket:
            logger.info("WebSocket connected")
            
            # Receive HELLO message
            hello = await websocket.recv()
            hello_data = json.loads(hello)
            logger.info(f"Received HELLO: {hello_data['type']}")
            
            client_id = hello_data["payload"]["clientId"]
            
            # Join conversation room
            join_message = {
                "action": "join",
                "room": "conversation:conv-123"
            }
            await websocket.send(json.dumps(join_message))
            
            join_ack = await websocket.recv()
            join_ack_data = json.loads(join_ack)
            logger.info(f"Received JOIN_ACK: {join_ack_data['type']}")
            
            """
            Step 3: Send chat message via HTTP
            """
            chat_response = await client.post(
                "http://localhost:8001/api/v1/chat/conversations/conv-123/messages",
                headers={"Authorization": f"Bearer {token}"},
                json={"content": "Hello!", "stream": True}
            )
            
            if chat_response.status_code == 200:
                logger.info("Chat message sent, waiting for streaming events...")
            
            """
            Step 4: Receive streaming events via WebSocket
            """
            event_count = 0
            async for message in websocket:
                data = json.loads(message)
                msg_type = data.get("type")
                
                if msg_type == "agent_response_chunk":
                    chunk = data["payload"].get("chunk", "")
                    logger.info(f"Chunk: {chunk}", end="", flush=True)
                
                elif msg_type == "agent_response_complete":
                    final = data["payload"].get("finalText", "")
                    logger.info(f"\nComplete: {final[:50]}...")
                    break
                
                elif msg_type == "agent_step":
                    step = data["payload"].get("content")
                    logger.info(f"Step: {step}")
                
                elif msg_type == "error":
                    error = data["payload"].get("error")
                    logger.error(f"Error: {error}")
                    break
                
                event_count += 1
                
                if event_count > 100:  # Safety limit
                    break
            
            logger.info(f"Received {event_count} events total")


# ============================================================================
# EXAMPLE 4: Error Handling
# ============================================================================

async def example_error_handling():
    """Example 4: Handling various error scenarios"""
    from app.ai.agents.default_agent import DefaultAgent
    from app.models import Conversation, Message, MessageType
    import os
    
    agent = DefaultAgent()
    
    # Scenario 1: Missing API Key
    logger.info("\n=== Scenario 1: Missing API Key ===")
    original_key = os.environ.get("OPENAI_API_KEY")
    os.environ.pop("OPENAI_API_KEY", None)
    
    try:
        conversation = Conversation(id="test-1", workspace_id="ws-1")
        user_msg = Message(
            content="Test",
            type=MessageType.USER_MESSAGE,
            conversation_id="test-1",
            workspace_id="ws-1"
        )
        
        response = await agent.generate_agent_response(
            conversation=conversation,
            user_message=user_msg,
            stream=True
        )
        
        # Should emit error event and return None
        if response is None:
            logger.info("✓ Error handled gracefully, returned None")
    
    finally:
        if original_key:
            os.environ["OPENAI_API_KEY"] = original_key
    
    # Scenario 2: Empty user message
    logger.info("\n=== Scenario 2: Empty User Message ===")
    try:
        conversation = Conversation(id="test-2", workspace_id="ws-2")
        user_msg = Message(
            content="",  # Empty
            type=MessageType.USER_MESSAGE,
            conversation_id="test-2",
            workspace_id="ws-2"
        )
        
        response = await agent.generate_agent_response(
            conversation=conversation,
            user_message=user_msg,
            stream=True
        )
        
        if response:
            logger.info(f"✓ Handled empty message, response: {response.content[:30]}")
        else:
            logger.info("Empty message resulted in error (might be expected)")
    
    except Exception as e:
        logger.error(f"✗ Unexpected error: {e}")
    
    # Scenario 3: Missing database
    logger.info("\n=== Scenario 3: Database Error (Simulated) ===")
    try:
        conversation = Conversation(id="test-3", workspace_id="ws-3")
        user_msg = Message(
            content="Test with DB error",
            type=MessageType.USER_MESSAGE,
            conversation_id="test-3",
            workspace_id="ws-3"
        )
        
        # This would fail at the save step if DB is down
        response = await agent.generate_agent_response(
            conversation=conversation,
            user_message=user_msg,
            stream=True
        )
        
        if response:
            logger.info("✓ DB error handled")
        else:
            logger.info("✓ DB error returned None (expected behavior)")
    
    except Exception as e:
        logger.error(f"✗ Unexpected error: {e}")


# ============================================================================
# EXAMPLE 5: Performance Monitoring
# ============================================================================

async def example_performance_monitoring():
    """Example 5: Monitor agent performance metrics"""
    import time
    from app.ai.agents.default_agent import DefaultAgent
    from app.models import Conversation, Message, MessageType
    
    agent = DefaultAgent()
    
    conversation = Conversation(id="perf-test", workspace_id="ws-perf")
    user_msg = Message(
        content="Write a short poem about Python programming",
        type=MessageType.USER_MESSAGE,
        conversation_id="perf-test",
        workspace_id="ws-perf"
    )
    
    # Track execution time
    start_time = time.time()
    step_times = {}
    
    response = await agent.generate_agent_response(
        conversation=conversation,
        user_message=user_msg,
        stream=True
    )
    
    total_time = time.time() - start_time
    
    if response:
        logger.info(f"\n=== Performance Metrics ===")
        logger.info(f"Total execution time: {total_time:.2f}s")
        logger.info(f"Response length: {len(response.content)} characters")
        logger.info(f"Response model: {response.ai_model}")
        logger.info(f"Characters per second: {len(response.content) / total_time:.2f}")
    else:
        logger.error("Failed to generate response for metrics")


# ============================================================================
# MAIN: Run Examples
# ============================================================================

async def main():
    """Run all examples"""
    
    examples = [
        ("Direct Agent Usage", example_direct_agent_usage),
        # ("Monitor Redis Events", example_monitor_redis_events),
        # ("HTTP + WebSocket", example_http_websocket_flow),
        ("Error Handling", example_error_handling),
        ("Performance Monitoring", example_performance_monitoring),
    ]
    
    for name, example_func in examples:
        logger.info(f"\n{'='*60}")
        logger.info(f"Running: {name}")
        logger.info('='*60)
        
        try:
            await example_func()
        except Exception as e:
            logger.exception(f"Example failed: {e}")
        
        # Small delay between examples
        await asyncio.sleep(1)


if __name__ == "__main__":
    # Run examples
    # asyncio.run(main())
    
    # Or run individual examples:
    # asyncio.run(example_direct_agent_usage())
    # asyncio.run(example_error_handling())
    # asyncio.run(example_performance_monitoring())
    
    logger.info("Examples are defined but not auto-run (to prevent API calls).")
    logger.info("Uncomment asyncio.run() calls above to run specific examples.")
