# Contributing to Word Search Multiplayer

Thank you for contributing! This guide will help you add new features following our architecture.

## Adding a New Feature

### 1. Create Database Migration (if needed)

```bash
npx drizzle-kit generate
```

Edit the migration file in `drizzle/meta/` if needed.

### 2. Add Types

Create or update types in `features/*/types/index.ts`:

```typescript
export interface NewFeatureInput {
  readonly id: string;
  readonly name: string;
}
```

### 3. Create tRPC Router

Add to `features/*/api/*Router.ts`:

```typescript
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from './trpc';

export const newFeatureRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Business logic here
    }),
});
```

### 4. Create Service Layer

Create `features/*/services/*Service.ts`:

```typescript
import { AppError } from '@/lib/errors';
import type { DrizzleDB } from '@/lib/db';

export class NewFeatureService {
  constructor(private db: DrizzleDB) {}

  async create(input: NewFeatureInput) {
    // Pure business logic
  }
}
```

### 5. Create UI Components

Add to `features/*/ui/*`:

```typescript
import React from 'react';

interface NewFeatureProps {
  // Props with readonly where possible
}

export function NewFeatureComponent(props: NewFeatureProps) {
  // Component logic
}
```

### 6. Create Hooks (if needed)

Add to `features/*/hooks/*`:

```typescript
import { useState, useEffect } from 'react';

export function useNewFeature() {
  // Custom hook logic
}
```

### 7. Write Tests

#### Unit Tests (`tests/unit/`)

```typescript
import { describe, it, expect } from '@jest/globals';
import { NewFeatureService } from '@/features/game/services/GameService';

describe('NewFeatureService', () => {
  it('should create feature', async () => {
    const service = new NewFeatureService(mockDb);
    const result = await service.create({ id: '1', name: 'Test' });
    expect(result).toBeDefined();
  });
});
```

#### Integration Tests (`tests/integration/`)

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createCaller } from '@/server/trpc';

describe('newFeature router', () => {
  let caller: any;
  
  beforeAll(async () => {
    caller = createCaller({ db: testDb });
  });
  
  it('should create session', async () => {
    const result = await caller.newFeature.create({ name: 'Test' });
    expect(result.id).toBeDefined();
  });
});
```

#### E2E Tests (`tests/e2e/`)

```typescript
import { test, expect } from '@playwright/test';

test('user can create a game', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="create-game"]');
  await expect(page).toHaveURL(/\/game\/.*/);
});
```

### 8. Update Documentation

- Add new tRPC endpoint to README
- Update API documentation
- Add JSDoc to public functions

## Code Style Rules

### TypeScript

- ✅ Use `readonly` for immutable data
- ✅ Use strict null checks
- ✅ No `any` - use `unknown` with type guards
- ✅ Exhaustive checks for discriminated unions

```typescript
// ✅ Good
type Status = 'waiting' | 'active' | 'finished';

function getStatusText(status: Status): string {
  switch (status) {
    case 'waiting': return 'Waiting';
    case 'active': return 'Active';
    case 'finished': return 'Finished';
    default: throw new Error(`Unhandled status: ${status}`);
  }
}

// ❌ Bad
function getStatusText(status: string): string {
  return status; // No validation
}
```

### Error Handling

```typescript
// ✅ Use AppError
import { AppError } from '@/lib/errors';

throw new AppError('NOT_FOUND', 'Session not found');

// ❌ Don't use generic Error
throw new Error('Session not found');
```

### Component Structure

```typescript
// ✅ Presentational components receive props
interface GameBoardProps {
  readonly grid: string[][];
  readonly onWordSelect: (word: string) => void;
}

export function GameBoard({ grid, onWordSelect }: GameBoardProps) {
  // No direct API calls
}

// ✅ Container components handle logic
export function GamePage() {
  const { data } = trpc.game.getSessionState.useQuery(...);
  return <GameBoard grid={data?.grid} onWordSelect={handleWordSelect} />;
}
```

## Git Workflow

1. Create feature branch: `git checkout -b feature/new-feature`
2. Commit changes: `git commit -m "feat: add new feature"`
3. Push: `git push origin feature/new-feature`
4. Open Pull Request
5. Request review
6. Merge after approval

## Commit Messages

Follow Conventional Commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance

## Code Review Checklist

- [ ] TypeScript compiles without errors
- [ ] No `any` types used
- [ ] All public functions have JSDoc
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Accessibility (a11y) considered
- [ ] Error handling implemented

## Questions?

Ask in the project chat or create an issue.
