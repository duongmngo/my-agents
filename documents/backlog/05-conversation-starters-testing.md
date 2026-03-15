# Conversation Starters Testing

**Priority:** Medium  
**Status:** Planning  
**Estimated Effort:** 2-3 days

## Overview

End-to-end testing and validation for the conversation starters feature.

---

## Testing Tasks

### End-to-End Tests

- [ ] Create agent with conversation starters
- [ ] Display conversation starters in chat
- [ ] Start conversation from starter
- [ ] Verify data persistence across sessions
- [ ] Test conversation starter UI edge cases

### Edge Cases to Test

- [ ] Empty starters list
- [ ] Long text in starter title/description
- [ ] Special characters in starters
- [ ] Maximum number of starters per agent
- [ ] Starter with missing optional fields

### Validation

- [ ] Verify starter data saved correctly to database
- [ ] Verify starters displayed correctly in agent chat
- [ ] Verify starter click creates conversation
- [ ] Verify starter prompt sent as first message
- [ ] Verify UI updates correctly after starter use

---

## Related Features

This is part of the Conversation Starters feature which is already implemented. See:
- [Conversation Starters Feature](../features/02-agent-management/)

## Notes

- Core functionality is complete, testing is outstanding
- Consider adding automated E2E tests with Playwright or Cypress
