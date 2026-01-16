# Tasks Management

## 🎯 Current Sprint

### ✅ Completed
- [x] Remove database session management from API layer
- [x] Refactor AgentRepository to stateless pattern
- [x] Fix frontend runtime error with agents.filter
- [x] Remove Templates tab from agent creation modal
- [x] Implement Conversation Starters feature with full configuration
  - Title, prompt, description, category, tags support
  - Add/Edit/Remove functionality
  - Visual category badges

# Built-in Agents Implementation
- [x] Define built-in agents list in backend (agents/built_in.json)
- [x] Implement loader to load built-in agents from JSON
- [x] Update Agent model for is_built_in and agent_type fields (already supported)
- [x] Update API to return built-in agents
- [x] Add section in UI to display built-in agents (already implemented)
- [x] Fetch and display built-in agents from API (already implemented)

### 🔄 In Progress

### 📋 To Do

#### Backend
- [ ] Update Agent model to support conversation_starters field (JSON)
- [ ] Create database migration for conversation_starters
- [ ] Update AgentCreate/AgentUpdate schemas to include conversationStarters
- [ ] Test agent CRUD with conversation starters
- [ ] Validate conversation starter data structure in backend

#### Frontend
 - [ ] Test conversation starters in agent creation flow
 - [ ] Integrate conversation starters with chat interface
 - [ ] Test conversation-starters.tsx component with new data structure
 - [ ] Add loading states for conversation starters
 - [ ] Handle edge cases (empty starters, long text, etc.)

#### Integration
- [ ] Test built-in agents display and interaction (end-to-end)
- [ ] End-to-end test: Create agent with conversation starters
- [ ] End-to-end test: Display conversation starters in chat
- [ ] End-to-end test: Start conversation from starter
- [ ] Verify data persistence across sessions

## 🐛 Bugs

### High Priority

### Medium Priority

### Low Priority

## 🚀 Features

### Planned
- [ ] Conversation starters suggestions based on agent type
- [ ] Import/Export conversation starters
- [ ] Conversation starter templates library
- [ ] Analytics for most-used conversation starters

### Ideas
- Conversation starter categories customization
- Multi-language support for starters
- AI-suggested conversation starters based on agent instructions

## 📚 Technical Debt
- [ ] Review and optimize database queries in repositories
- [ ] Add comprehensive error handling for conversation starters
- [ ] Add unit tests for conversation starter logic
- [ ] Document conversation starter data structure

## 🔍 Investigation
- [ ] Research best practices for conversation starter UX
- [ ] Evaluate conversation starter performance with large datasets
- [ ] Consider conversation starter versioning

## 📝 Documentation
- [ ] Document conversation starters feature in README
- [ ] Create user guide for configuring conversation starters
- [ ] API documentation for conversation starters endpoints

---

## Legend
- ✅ Completed
- 🔄 In Progress
- 📋 To Do
- 🐛 Bug
- 🚀 Feature
- 📚 Technical Debt
- 🔍 Investigation
- 📝 Documentation

## Priority Levels
- 🔴 High - Critical, blocks other work
- 🟡 Medium - Important, should be done soon
- 🟢 Low - Nice to have, can wait

---

**Last Updated:** January 9, 2026
