# Tool Management System

**Priority:** High  
**Status:** Planning  
**Estimated Effort:** 2-3 weeks

## Overview

Implement a comprehensive tool management system that allows users to configure, manage, and execute tools within agents. This includes built-in tools, custom API tools, and agent-level tool configuration.

---

## Database & Models

### Backend Models

- [ ] Create Tool model
  - `id`, `name`, `type`, `description`, `icon`
  - `is_built_in`, `config_schema`, `workspace_id`
- [ ] Create ToolConfig model
  - `id`, `tool_id`, `agent_id`, `config_values`, `is_enabled`
- [ ] Create AgentTool junction model
  - `agent_id`, `tool_id`, `priority`, `is_enabled`
- [ ] Create database migrations for tool tables
- [ ] Add indexes for tool queries (`workspace_id`, `agent_id`, `is_built_in`)

### Tool Types

- [ ] Define ToolType enum (`BUILT_IN`, `CUSTOM`)
- [ ] Define built-in tool identifiers
  - `search_knowledge_base`
  - `search_web`
  - `fetch_website`
  - `api_call`

---

## Built-in Tools System

### Tool Registry

- [ ] Create `tools/built_in.json` for built-in tool definitions
- [ ] Implement `BuiltInToolLoader` to load tools from JSON
- [ ] Define config schema for each built-in tool:

| Tool | Config Options |
|------|----------------|
| `search_knowledge_base` | `top_k`, `similarity_threshold`, `search_scope` |
| `search_web` | `max_results`, `search_depth`, `include_domains`, `exclude_domains` |
| `fetch_website` | `timeout`, `max_content_length`, `allowed_domains` |
| `api_call` | `url`, `method`, `headers`, `body_template`, `auth_type`, `response_mapping` |

- [ ] Create tool execution interface (`BaseTool` abstract class)

### Tool Configuration

- [ ] Create default configurations for built-in tools
- [ ] Implement workspace-level tool configuration
- [ ] Implement agent-level tool configuration override

### API Call Tool (Built-in)

- [ ] Support HTTP methods (GET, POST, PUT, DELETE, PATCH)
- [ ] Support authentication types (none, api_key, bearer, basic, oauth2)
- [ ] Support request/response mapping
- [ ] Support variable interpolation in templates (`{{variable}}`)
- [ ] Add timeout and retry configuration
- [ ] Add error handling and logging
- [ ] Create test endpoint for API call tool
- [ ] Support dry-run mode
- [ ] Display request/response preview

---

## Backend API

### Tool CRUD Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tools` | List all tools (built-in + custom) |
| GET | `/api/v1/tools/{tool_id}` | Get tool details |
| POST | `/api/v1/tools` | Create custom/API tool |
| PUT | `/api/v1/tools/{tool_id}` | Update tool |
| DELETE | `/api/v1/tools/{tool_id}` | Delete tool |
| POST | `/api/v1/tools/{tool_id}/test` | Test tool execution |

### Agent Tool Configuration Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/agents/{agent_id}/tools` | List agent's tools |
| POST | `/api/v1/agents/{agent_id}/tools` | Add tool to agent |
| PUT | `/api/v1/agents/{agent_id}/tools/{tool_id}` | Update tool config |
| DELETE | `/api/v1/agents/{agent_id}/tools/{tool_id}` | Remove tool from agent |
| POST | `/api/v1/agents/{agent_id}/tools/reorder` | Reorder tools |

### Tool DTOs

- [ ] Create `ToolCreate`, `ToolUpdate`, `ToolResponse` schemas
- [ ] Create `ToolConfigCreate`, `ToolConfigUpdate`, `ToolConfigResponse` schemas
- [ ] Create `AgentToolCreate`, `AgentToolResponse` schemas

---

## Frontend - Tool Management Page

### Page Layout

- [ ] Create `/tools` route and page
- [ ] Add Tools to sidebar navigation
- [ ] Create `ToolsLayout` component with tabs (Built-in, API Tools, Custom)

### Tool List View

- [ ] Create `ToolList` component
- [ ] Create `ToolCard` component (icon, name, description, type badge, status)
- [ ] Add search and filter functionality
- [ ] Add sorting options (name, type, usage)

### Built-in Tool Configuration

- [ ] Create `BuiltinToolConfig` component
- [ ] Display tool description and capabilities
- [ ] Show configuration options with defaults
- [ ] Implement save configuration functionality
- [ ] Add reset to defaults button

### API Tool Management

- [ ] Create `ApiToolForm` component
  - URL input with method selector (GET, POST, PUT, DELETE)
  - Headers editor (key-value pairs)
  - Body template editor with syntax highlighting
  - Authentication configuration
  - Response mapping configuration
- [ ] Create `ApiToolTestPanel` component
  - Test request button
  - Request preview
  - Response display with formatting
  - Error display
- [ ] Create `ApiToolList` component

---

## Frontend - Agent Tool Configuration

### Agent Form Integration

- [ ] Add Tools tab/section to `AgentForm`
- [ ] Create `AgentToolSelector` component
- [ ] Display available tools with checkboxes
- [ ] Show tool configuration inline or in modal

### Tool Priority & Ordering

- [ ] Implement drag-and-drop reordering
- [ ] Display tool execution priority
- [ ] Save tool order to backend

### Tool Configuration Override

- [ ] Allow agent-specific tool configuration
- [ ] Show inherited vs overridden config
- [ ] Reset to workspace defaults option

---

## Agent Integration

### Dynamic Tool Loading

- [ ] Update `DefaultAgent` to load tools from configuration
- [ ] Implement tool discovery at runtime
- [ ] Support dynamic tool enable/disable

### Tool Execution Framework

- [ ] Create `ToolExecutionContext` class
- [ ] Implement tool result caching
- [ ] Add tool execution metrics
- [ ] Support parallel tool execution

### Plan Node Updates

- [ ] Update planning prompt to list available tools dynamically
- [ ] Generate tool-specific instructions based on config
- [ ] Handle tool availability in planning

### Execute Tools Node Updates

- [ ] Refactor to use tool registry
- [ ] Support API tool execution
- [ ] Handle tool-specific error cases
- [ ] Emit tool-specific events

---

## Dependencies

- Requires: Knowledge base feature (for search_knowledge_base tool)
- Enables: Advanced agent capabilities, API integrations

## Notes

- Consider tool versioning for future compatibility
- Plan for tool marketplace in Phase 2
