# CLAUDE.md - AI Assistant Guidelines for Intelagent Platform

## 🚨 CRITICAL: Read This First
This document contains essential patterns and rules for maintaining the Intelagent Platform codebase. Claude Code will automatically reference this file when making changes.

## Project Overview
- **Monorepo Structure**: Uses Turborepo with multiple packages
- **Main Apps**: customer-portal (Next.js 14.2.32)
- **Core Packages**: database (Prisma), skills-orchestrator
- **Deployment**: Railway with Docker (Alpine Linux)
- **Node Version**: 18.x
- **TypeScript**: Strict mode recommended

## 🔴 TypeScript Patterns - MUST FOLLOW

### 1. BaseSkill Implementation Pattern
```typescript
// ✅ CORRECT - All skills MUST follow this pattern
import { BaseSkill } from '../BaseSkill';
import { SkillParams, SkillResult, SkillCategory } from '../../types';

export class ExampleSkill extends BaseSkill {
  metadata = {
    id: 'example_skill',
    name: 'Example Skill',
    description: 'Description here',
    category: SkillCategory.AUTOMATION, // Use valid category
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['example']
  };

  validate(params: SkillParams): boolean {
    return !!params.requiredField;
  }

  protected async executeImpl(params: SkillParams): Promise<SkillResult> {
    // Implementation here
    return {
      success: true,
      data: {},
      metadata: {
        skillId: this.metadata.id,
        skillName: this.metadata.name,
        timestamp: new Date()
      }
    };
  }
}
```

### 2. Type Inference Issues - Common Fixes
```typescript
// ❌ WRONG - TypeScript infers as never[]
const matches = str.match(/pattern/g) || [];
matches.forEach(match => { /* Error: match is 'never' */ });

// ✅ CORRECT - Explicit typing
const matches: string[] = str.match(/pattern/g) || [];
matches.forEach((match: string) => { /* Works */ });
```

### 3. Import Paths
```typescript
// For skills in impl/ folder:
import { SkillParams } from '../../types';

// For skills in impl/subfolder/ (like seo/):
import { SkillParams } from '../../../types';
```

### 4. Prisma Schema Fields (Current as of deployment)
```typescript
// skill_audit_log table (NOT skill_logs)
await prisma.skill_audit_log.create({
  data: {
    event_type: 'execution',
    skill_id: 'skill_id',
    user_id: 'user_id',
    license_key: 'key', // NOT product_key in this table
    event_data: {}, // JSON field
    created_at: new Date()
  }
});

// chatbot_logs table
await prisma.chatbot_logs.create({
  data: {
    customer_message: 'message',
    chatbot_response: 'response',
    product_key: 'key', // NOT license_key
    // NO messages field - use customer_message and chatbot_response
  }
});
```

### 5. Agent Architecture Pattern
```typescript
// All specialist agents MUST extend EventEmitter
import { EventEmitter } from 'events';

export class SpecialistAgent extends EventEmitter {
  // Use constructor, NOT getInstance singleton pattern
  constructor() {
    super();
  }
}
```

## 🟡 Common Pitfalls to Avoid

1. **Never use `execute()` directly** - Always use `protected async executeImpl()`
2. **No ES2018+ regex flags** - Don't use 's' flag, use `[\s\S]` instead
3. **Always type match() results** - Add `: string[]` explicitly
4. **Check Prisma relations** - Many relations don't exist, verify before using
5. **Use Date objects, not strings** - `timestamp: new Date()` not `toISOString()`

## 🟢 AI Fatigue Prevention Patterns

### 1. Skill Complexity Limits
```typescript
// Keep skills focused on single responsibilities
// If a skill does more than 3 distinct operations, split it

// ❌ BAD - Too complex
class DoEverythingSkill {
  async executeImpl(params) {
    // Fetch data
    // Process data
    // Send emails
    // Update database
    // Generate reports
    // etc...
  }
}

// ✅ GOOD - Separated concerns
class FetchDataSkill { /* ... */ }
class ProcessDataSkill { /* ... */ }
class EmailSenderSkill { /* ... */ }
```

### 2. Error Context Pattern
```typescript
// Always provide context in errors
throw new Error(`Skill ${this.metadata.id} failed: ${specific_reason}`);

// Not just:
throw new Error('Failed');
```

### 3. Validation First Pattern
```typescript
validate(params: SkillParams): boolean {
  // Validate BEFORE execution to fail fast
  if (!params.required) return false;
  if (params.value && typeof params.value !== 'string') return false;
  return true;
}
```

## 🔵 Development Commands

```bash
# Before pushing to GitHub/Railway:
npm run typecheck        # Run in root
npm run lint            # Run in root
npm run build           # Run in root

# For specific packages:
cd packages/skills-orchestrator && npm run build
cd apps/customer-portal && npm run build

# Database:
cd packages/database && npx prisma generate
cd packages/database && npx prisma db push
```

## 🟣 Railway Deployment Checklist

1. ✅ All TypeScript errors fixed
2. ✅ Prisma schema generated
3. ✅ Docker builds successfully
4. ✅ All skills have metadata and validate methods
5. ✅ No ES2018+ features used
6. ✅ All imports use correct relative paths

## 📋 Quick Reference

### Valid SkillCategories
- `COMMUNICATION`
- `DATA_PROCESSING`
- `AI_ML`
- `INTEGRATION`
- `AUTOMATION`
- `ANALYTICS`
- `SECURITY`
- `UTILITY`
- `MARKETING`
- `AI_POWERED`
- `AI_ANALYTICS`
- `BUSINESS`
- `BLOCKCHAIN`

### Database Tables (Actual Names)
- `skill_audit_log` (NOT skill_logs)
- `chatbot_logs` (NOT chatbot_conversations)
- `chatbot_config` (NOT chatbot_configurations)
- `product_keys` (NOT api_keys)
- `licenses` (for user licenses)

### Environment Variables Required
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY`

## 🚀 Testing New Skills

Before adding a new skill:
1. Extend BaseSkill
2. Add metadata object
3. Implement validate method
4. Use executeImpl (not execute)
5. Return proper SkillResult
6. Test locally with: `npm run test:skill -- SkillName`

## ⚠️ IMPORTANT: Sales Outreach Agent
The Sales Outreach Agent has custom implementation details. DO NOT modify without explicit user permission:
- Location: `packages/skills-orchestrator/src/skills/impl/SalesOutreachSkill.ts`
- Uses specialized email templates
- Has multi-stage campaign logic
- Integrates with CRM systems

## 💡 AI Assistant Notes

When Claude Code reads this file, it should:
1. Always follow these patterns when creating new code
2. Check existing code against these patterns before modifying
3. Suggest refactoring if code doesn't match patterns
4. Prevent accumulation of technical debt
5. Break complex tasks into smaller, manageable skills

---
Last Updated: After successful Railway deployment
Version: 1.0.0