# Shiro Developer Guide

## Getting Started

### Prerequisites

Before setting up Shiro, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **pnpm** (v9+)
- **Git**
- **Expo CLI** (for mobile development)

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/shiro.git
cd shiro
```

2. **Install dependencies:**

```bash
pnpm install
```

3. **Set up environment variables:**

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/shiro

# Claude API
CLAUDE_API_KEY=your_claude_api_key

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# App Configuration
VITE_APP_TITLE=Shiro
VITE_APP_LOGO=https://your-s3-url/logo.png
```

4. **Set up the database:**

```bash
pnpm db:push
```

5. **Start the development server:**

```bash
pnpm dev
```

The app will be available at `http://localhost:8081` (web) and via Expo Go on mobile.

## Project Structure

```
shiro/
├── app/                          # React Native app
│   ├── (tabs)/                   # Tab-based navigation
│   │   ├── index.tsx             # Home screen
│   │   ├── ask.tsx               # Gaia chat
│   │   └── profile.tsx           # Profile tab
│   ├── screens/                  # Non-tab screens
│   │   ├── learning-path-detail.tsx
│   │   ├── lesson-content.tsx
│   │   ├── review-screen.tsx
│   │   └── baseline-evaluation.tsx
│   ├── oauth/                    # OAuth callback
│   └── _layout.tsx               # Root layout
├── components/                   # Reusable components
│   ├── screen-container.tsx      # SafeArea wrapper
│   ├── review-button.tsx         # Review button
│   ├── loading-quote.tsx         # Loading animation
│   └── ui/                       # UI components
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts               # Authentication
│   ├── use-colors.ts             # Theme colors
│   ├── use-pending-reviews.ts    # Pending reviews
│   ├── use-claude-lesson.ts      # Claude content
│   └── use-lesson-session.ts     # Lesson session
├── lib/                          # Utilities
│   ├── trpc.ts                   # tRPC client
│   ├── utils.ts                  # Helper functions
│   └── philosophical-quotes.ts   # Quote data
├── server/                       # Backend
│   ├── _core/                    # Core server setup
│   │   ├── index.ts              # Express app
│   │   ├── oauth.ts              # OAuth setup
│   │   └── trpc.ts               # tRPC setup
│   ├── routers/                  # tRPC routers
│   │   ├── claude-content.ts
│   │   ├── behavior-tracking.ts
│   │   ├── user-profile.ts
│   │   └── spaced-repetition.ts
│   ├── services/                 # Business logic
│   │   ├── meta-learning-selector.ts
│   │   ├── adaptive-difficulty.ts
│   │   ├── spaced-repetition.ts
│   │   ├── behavior-tracker.ts
│   │   ├── baseline-evaluator.ts
│   │   └── claude-content-generator.ts
│   ├── db.ts                     # Database connection
│   └── __tests__/                # Backend tests
├── drizzle/                      # Database schema
│   └── schema.ts
├── shared/                       # Shared types
│   ├── types.ts
│   └── _core/
│       └── errors.ts
├── assets/                       # Images & fonts
│   └── images/
│       ├── icon.png
│       ├── splash-icon.png
│       └── favicon.png
├── app.config.ts                 # Expo configuration
├── tailwind.config.js            # Tailwind configuration
├── theme.config.js               # Theme tokens
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies
├── PHILOSOPHY.md                 # Philosophy & vision
├── KNOWLEDGE_CARDS.md            # Knowledge framework
├── ARCHITECTURE.md               # Technical architecture
├── FEATURES.md                   # Feature documentation
└── README.md                     # Project overview
```

## Development Workflow

### Running the App

**Web:**
```bash
pnpm dev:metro
```

**iOS (requires macOS):**
```bash
pnpm ios
```

**Android:**
```bash
pnpm android
```

**Expo Go (mobile):**
```bash
pnpm qr
```
Then scan the QR code with Expo Go app.

### Code Style

Shiro follows these code style guidelines:

- **TypeScript** — Strict mode enabled, no `any` types
- **Formatting** — Prettier (run `pnpm format`)
- **Linting** — ESLint (run `pnpm lint`)
- **Naming** — camelCase for variables/functions, PascalCase for components

### Testing

**Run all tests:**
```bash
pnpm test
```

**Run tests in watch mode:**
```bash
pnpm test:watch
```

**Run specific test file:**
```bash
pnpm test -- lesson-content.test.ts
```

**Test coverage:**
```bash
pnpm test:coverage
```

### Writing Tests

Shiro uses Vitest for testing. Example test:

```typescript
import { describe, it, expect } from "vitest";
import { SpacedRepetitionEngine } from "@/server/services/spaced-repetition";

describe("SpacedRepetitionEngine", () => {
  it("should calculate next review date correctly", () => {
    const engine = new SpacedRepetitionEngine();
    const nextDate = engine.calculateNextReviewDate(1, 2.5, 0);
    expect(nextDate).toBeGreaterThan(new Date());
  });
});
```

## API Development

### Adding a New tRPC Endpoint

1. **Create a new router** in `server/routers/`:

```typescript
import { router, publicProcedure } from "@/server/_core/trpc";
import { z } from "zod";

export const myRouter = router({
  myEndpoint: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input }) => {
      // Implementation
      return { result: "success" };
    }),
});
```

2. **Register the router** in `server/routers.ts`:

```typescript
export const appRouter = router({
  myRouter: myRouter,
  // ... other routers
});
```

3. **Use in frontend:**

```typescript
const { data } = await trpc.myRouter.myEndpoint.query({ id: "123" });
```

### Calling External APIs

**Claude API Example:**

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const message = await client.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: "Explain quantum mechanics",
    },
  ],
});
```

## Database Operations

### Running Migrations

```bash
pnpm db:push
```

### Creating a New Migration

```bash
pnpm db:generate
```

### Querying the Database

```typescript
import { db } from "@/server/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

// Select
const user = await db.query.users.findFirst({
  where: eq(users.id, "123"),
});

// Insert
await db.insert(users).values({
  email: "user@example.com",
  name: "John Doe",
});

// Update
await db.update(users)
  .set({ name: "Jane Doe" })
  .where(eq(users.id, "123"));

// Delete
await db.delete(users)
  .where(eq(users.id, "123"));
```

## Debugging

### Enable Debug Logging

Set environment variable:
```bash
DEBUG=shiro:* pnpm dev
```

### Browser DevTools

- **Web** — Open browser DevTools (F12)
- **Mobile** — Use Expo DevTools (shake device, select "Debug remote JS")

### Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | Kill process: `lsof -i :8081` then `kill -9 <PID>` |
| Database connection error | Check DATABASE_URL in .env |
| Claude API timeout | Increase timeout in `claude-content-generator.ts` |
| Module not found | Clear cache: `rm -rf node_modules/.vite` |

## Deployment

### Building for Production

**Web:**
```bash
pnpm build
```

**Mobile (requires Expo account):**
```bash
eas build --platform ios
eas build --platform android
```

### Environment Variables for Production

Update `.env.production` with production values:

```env
DATABASE_URL=postgresql://prod-user:prod-password@prod-host:5432/shiro
CLAUDE_API_KEY=prod_claude_key
# ... other production values
```

### Deploying Backend

Deploy to your hosting provider (AWS, Vercel, Railway, etc.):

```bash
# Build
pnpm build

# Start
pnpm start
```

## Contributing

### Code Review Checklist

Before submitting a PR:

- [ ] Code follows style guidelines
- [ ] All tests pass (`pnpm test`)
- [ ] No TypeScript errors (`pnpm check`)
- [ ] No console errors or warnings
- [ ] Documentation updated
- [ ] Commit messages are clear

### Git Workflow

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -m "Add my feature"`
3. Push to GitHub: `git push origin feature/my-feature`
4. Create a Pull Request

## Performance Tips

### Optimize Renders

- Use `useMemo` for expensive computations
- Use `useCallback` for stable function references
- Avoid inline object/array creation in render

### Optimize Bundle Size

- Use dynamic imports for large components
- Tree-shake unused code
- Minify assets

### Optimize Database Queries

- Use indexes on frequently queried fields
- Avoid N+1 queries
- Use pagination for large result sets

## Resources

- **React Native Docs** — https://reactnative.dev/
- **Expo Docs** — https://docs.expo.dev/
- **tRPC Docs** — https://trpc.io/
- **Drizzle ORM Docs** — https://orm.drizzle.team/
- **TypeScript Docs** — https://www.typescriptlang.org/

---

**Happy coding! If you have questions, please open an issue on GitHub.**
