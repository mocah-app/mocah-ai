# Comprehensive Testing Integration Plan for Mocah

> **Purpose:** Complete testing strategy and implementation plan for Mocah AI email template platform  
> **Last Updated:** 2025-01-03  
> **Status:** Phase 1 Complete ✅

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Stack](#testing-stack)
3. [Test Architecture](#test-architecture)
4. [Unit Testing](#unit-testing)
5. [Integration Testing](#integration-testing)
6. [End-to-End Testing](#end-to-end-testing)
7. [Regression Testing](#regression-testing)
8. [Performance Testing](#performance-testing)
9. [Test Infrastructure Setup](#test-infrastructure-setup)
10. [CI/CD Integration](#cicd-integration)
11. [Implementation Phases](#implementation-phases)
12. [Best Practices](#best-practices)

---

## Overview

### Current State
- ✅ No existing test infrastructure
- ✅ Monorepo structure (Turborepo + pnpm workspaces)
- ✅ Next.js 16 App Router
- ✅ tRPC API layer
- ✅ Prisma ORM with PostgreSQL
- ✅ Better Auth authentication
- ✅ Stripe payment integration
- ✅ Complex business logic (templates, AI generation, subscriptions)

### Testing Goals
1. **Confidence**: Ensure code changes don't break existing functionality
2. **Documentation**: Tests serve as living documentation
3. **Speed**: Fast feedback loop for developers
4. **Coverage**: Critical paths covered (80%+ coverage target)
5. **Maintainability**: Tests are easy to write, read, and maintain

### Testing Pyramid

```
        /\
       /  \      E2E Tests (10%)
      /____\     Critical user flows
     /      \    
    /________\   Integration Tests (30%)
   /          \  API + DB, Auth flows, Webhooks
  /____________\ Unit Tests (60%)
                Components, utilities, API procedures
```

---

## Testing Stack

### Recommended Stack (Based on testing-setup.md)

**Option 1: Vitest + React Testing Library + Playwright** ✅ **RECOMMENDED**

Required dependencies include: vitest, @vitejs/plugin-react, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, vite-tsconfig-paths, @playwright/test, @vitest/ui, msw, @faker-js/faker, and vitest-mock-extended.

**Why This Stack?**
- ✅ Production-ready stability
- ✅ Full feature set (fake timers, mocking, isolation)
- ✅ Excellent IDE support
- ✅ Fast execution (~4-10x faster than Jest)
- ✅ Works seamlessly with Next.js 16
- ✅ Playwright for reliable E2E tests
---

## Test Architecture

### Directory Structure

```
mocah/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── __tests__/              # Colocated unit tests
│       │   │   ├── components/
│       │   │   ├── utils/
│       │   │   └── hooks/
│       │   └── app/
│       │       └── __tests__/          # Page/route tests
│       ├── tests/
│       │   ├── e2e/                    # Playwright E2E tests
│       │   │   ├── auth.spec.ts
│       │   │   ├── templates.spec.ts
│       │   │   ├── subscriptions.spec.ts
│       │   │   └── fixtures/
│       │   └── integration/            # Integration test helpers
│       ├── vitest.config.ts
│       └── playwright.config.ts
│
├── packages/
│   ├── api/
│   │   ├── src/
│   │   │   ├── __tests__/              # Unit tests for API procedures
│   │   │   │   ├── routers/
│   │   │   │   │   ├── template.test.ts
│   │   │   │   │   ├── subscription.test.ts
│   │   │   │   │   └── ...
│   │   │   │   └── lib/
│   │   │   └── test-utils/              # Test utilities & mocks
│   │   │       ├── db.ts               # Test DB setup
│   │   │       ├── auth.ts              # Auth mocking
│   │   │       └── stripe.ts           # Stripe mocking
│   │   └── vitest.config.ts
│   │
│   ├── auth/
│   │   └── src/
│   │       └── __tests__/
│   │
│   ├── db/
│   │   └── prisma/
│   │       └── test-setup.ts           # Test DB migrations
│   │
│   └── shared/
│       └── src/
│           └── __tests__/
│
└── tests/                              # Shared test utilities
    ├── setup/
    │   ├── global-setup.ts
    │   └── test-env.ts
    └── fixtures/
        ├── users.ts
        ├── templates.ts
        └── organizations.ts
```

### Test Configuration Files

**Root `vitest.config.ts`** (for shared config)
- Configure with globals enabled, node environment, and setup files pointing to test environment configuration

**`apps/web/vitest.config.ts`**
- Configure with React plugin, tsconfig paths, jsdom environment, setup files, test file patterns, and coverage settings

**`packages/api/vitest.config.ts`**
- Configure with tsconfig paths, node environment, setup files, and coverage settings

**`apps/web/playwright.config.ts`**
- Configure with test directory, parallel execution, retries, base URL, browser projects (Chromium, Firefox, WebKit), and web server settings

---

## Unit Testing

### Scope
- React components (Client & Server Components)
- Utility functions
- Custom hooks
- tRPC procedures
- Business logic functions
- Validation schemas

### Component Testing

Test React components by rendering them and verifying:
- Components render with correct children and props
- Event handlers are called when interactions occur
- Disabled states and other conditional rendering work correctly
- Accessibility attributes are present

### tRPC Procedure Testing

Test tRPC procedures by:
- Creating test context with mocked database and session
- Testing successful operations with valid inputs
- Testing error cases (validation errors, authorization failures, not found errors)
- Verifying return values match expected structure
- Testing edge cases and boundary conditions

### Utility Function Testing

Test utility functions by:
- Testing with various input values
- Verifying correct output formats
- Testing edge cases (null, undefined, empty strings, etc.)
- Testing error handling when applicable

### Test Utilities & Helpers

Create reusable test utilities:

**Test Context Helper**
- Function to create test context with mocked database and session
- Supports overrides for custom test scenarios
- Returns properly typed context object

**Database Helpers**
- Function to create test database connection
- Runs migrations before tests
- Function to clean up test database (truncate tables)
- Handles connection pooling and reuse

**Test Fixtures**
- Factory functions to create test users, templates, organizations, etc.
- Uses faker for realistic test data
- Supports overrides for specific test cases
- Handles relationships between entities

---

## Integration Testing

### Scope
- API + Database interactions
- Authentication flows
- Stripe webhook processing
- File upload/storage operations
- Redis caching
- External API integrations (OpenRouter, FAL)

### API + Database Integration Tests

Test API procedures with real database interactions:
- Create test context with database connection
- Call API procedures and verify results
- Query database directly to verify data persistence
- Test relationships and cascading operations
- Clean up database after each test

### Authentication Integration Tests

Test authentication flows:
- User registration creates user and session
- User login with valid credentials succeeds
- User login with invalid credentials fails
- Session management and refresh
- Password reset flow
- Email verification flow

### Stripe Webhook Integration Tests

Test Stripe webhook processing:
- Handle subscription created events
- Handle subscription updated events
- Handle subscription deleted events
- Handle payment succeeded events
- Handle payment failed events
- Verify database updates match webhook payloads
- Test idempotency (duplicate events)

### MSW for External API Mocking

Use Mock Service Worker (MSW) to mock external APIs:
- Set up MSW server in test setup files
- Configure handlers for external API endpoints (OpenRouter, FAL, etc.)
- Reset handlers between tests
- Handle unhandled requests appropriately
- Return realistic mock responses matching API contracts

---

## End-to-End Testing

### Scope
- Critical user journeys
- Authentication flows
- Template creation and editing
- Subscription management
- Payment flows
- Library browsing and remixing

### E2E Test Structure

Write E2E tests for critical user journeys:

**Template Management Flow**
- Navigate to template creation page
- Enter prompt and generate template
- Verify template editor appears
- Edit template code and save changes
- Verify changes persist
- Publish template to library
- Verify template appears in public library

**Subscription Flow**
- Login as user
- Navigate to pricing page
- Start trial or subscribe to plan
- Complete Stripe checkout with test card
- Verify redirect to success page
- Verify subscription status updates
- Verify usage limits apply correctly

### E2E Test Helpers

Create reusable helper functions for common E2E operations:
- Authentication helpers (login, logout, create test user)
- Template helpers (create template, navigate to template, publish template)
- Navigation helpers (go to specific pages, wait for elements)
- Form helpers (fill forms, submit forms)
- Assertion helpers (verify UI states, verify data)

---

## Regression Testing

### Scope
- Previously fixed bugs
- Critical business logic
- Payment/subscription edge cases
- Authentication security
- Data integrity

### Regression Test Suite

Create regression tests for:
- Previously fixed bugs (reference issue numbers)
- Critical business logic edge cases
- Payment/subscription edge cases
- Authentication security vulnerabilities
- Data integrity issues

### Visual Regression Testing

Use Playwright's screenshot comparison:
- Capture screenshots of key pages and components
- Compare against baseline images
- Detect visual regressions automatically
- Test across different browsers and viewports

---

## Performance Testing

### Scope
- API response times
- Page load times
- Database query performance
- AI generation latency
- Concurrent user handling

### Performance Test Examples

**API Performance Tests**
- Measure response times for API endpoints
- Set performance thresholds (e.g., template list < 500ms)
- Test with various data sizes
- Monitor query performance

**E2E Performance Tests**
- Measure page load times
- Test with network throttling
- Verify time to interactive
- Test with various connection speeds

---

## Test Infrastructure Setup

### Database Setup

Create test database setup functions:
- Function to initialize test database
- Run migrations before tests
- Optionally seed test data
- Function to clean up after tests
- Handle connection pooling

### Environment Variables

Configure test environment variables:
- Test database URL (separate from development)
- Test Stripe keys (use test mode keys)
- Test Redis connection
- Mock/test API keys for external services
- All test-specific configuration

### Test Scripts

Add test scripts to package.json:
- `test`: Run unit tests
- `test:ui`: Run tests with UI
- `test:coverage`: Run tests with coverage
- `test:e2e`: Run E2E tests
- `test:e2e:ui`: Run E2E tests with UI
- `test:all`: Run all tests
- `test:watch`: Run tests in watch mode
- `test:ci`: Run tests for CI/CD

Update Turborepo configuration to include test tasks with proper dependencies and caching.

---

## CI/CD Integration

### GitHub Actions Workflow

Set up CI/CD workflow with:
- Trigger on push to main/develop and pull requests
- Unit tests job: checkout, setup pnpm/node, install dependencies, setup test database, run tests, upload coverage
- E2E tests job: checkout, setup pnpm/node, install dependencies, install Playwright browsers, run E2E tests, upload test results
- Parallel execution of test jobs
- Artifact uploads for test reports and coverage

---

## Implementation Phases

### Phase 1: Foundation (Week 1) ✅ COMPLETE
- [x] Install testing dependencies (Vitest 4.0.16, Playwright 1.57, RTL, faker, msw)
- [x] Set up Vitest configuration (root, apps/web, packages/api, packages/shared)
- [x] Set up Playwright configuration (Chromium, Firefox, WebKit)
- [x] Create test utilities and helpers (setup files, mocks)
- [x] Set up test fixtures (users, templates, organizations factories)
- [x] Write first unit tests (56 tests: color-utils, file-utils, utils, convert-dates, constants)
- [x] Set up GitHub Actions CI workflow

### Phase 2: API Testing (Week 2) ✅ COMPLETE
- [x] Set up API test utilities (mock context, mock db, mock session)
- [x] Write unit tests for lib functions (html-tag-repair, json-repair) - 24 tests
- [x] Set up MSW for external API mocking (OpenRouter, FAL, Stripe, Firecrawl)
- [x] Write router tests (subscription router) - 18 tests
- [x] Test authentication (protectedProcedure middleware)
- [x] Test authorization (subscription checks, trial status)

### Phase 3: Component Testing (Week 3)
- [ ] Write tests for shared UI components
- [ ] Write tests for form components
- [ ] Write tests for complex components (editor, canvas)
- [ ] Test custom hooks
- [ ] Achieve 70%+ coverage on components

### Phase 4: E2E Testing (Week 4)
- [ ] Write E2E tests for critical user flows
- [ ] Test authentication flows
- [ ] Test template creation/editing
- [ ] Test subscription flows
- [ ] Test library browsing

### Phase 5: Advanced Testing (Week 5)
- [ ] Write regression tests
- [ ] Set up performance testing
- [ ] Set up visual regression testing
- [ ] Write tests for edge cases
- [ ] Achieve 80%+ overall coverage

### Phase 6: CI/CD Integration (Week 6) 🚧 STARTED
- [x] Set up GitHub Actions workflows (`.github/workflows/ci.yml`)
- [ ] Configure test reporting
- [ ] Set up coverage reporting
- [ ] Document testing practices
- [ ] Train team on testing practices

---

## Best Practices

### Writing Tests

1. **Follow AAA Pattern**
   - Arrange: Set up test data and conditions
   - Act: Execute the function or component being tested
   - Assert: Verify the expected outcome

2. **Use Descriptive Test Names**
   - ✅ `it('creates template when user is authenticated')`
   - ❌ `it('works')`

3. **Test Behavior, Not Implementation**
   - ✅ Test that clicking save button persists data
   - ❌ Test that `handleSave` function is called

4. **Keep Tests Isolated**
   - Each test should be independent
   - Use `beforeEach`/`afterEach` for setup/cleanup

5. **Use Test Data Builders**
   - Create factory functions for test data
   - Support overrides for specific test cases
   - Use faker for realistic test data

### Test Organization

1. **Colocate Tests**
   - Keep tests close to source code
   - Use `__tests__` directories or `.test.ts` files

2. **Group Related Tests**
   - Use describe blocks to group related tests
   - Nest describe blocks for hierarchical organization
   - Keep test descriptions clear and descriptive

3. **Use Test Fixtures**
   - Create reusable test data
   - Use factories for complex objects

### Performance

1. **Run Tests in Parallel**
   - Vitest runs tests in parallel by default
   - Use `test.concurrent` for independent tests

2. **Mock External Services**
   - Use MSW for HTTP mocking
   - Mock database calls when appropriate

3. **Clean Up Resources**
   - Close database connections
   - Clean up test data
   - Reset mocks between tests

### Maintenance

1. **Keep Tests Updated**
   - Update tests when code changes
   - Remove obsolete tests

2. **Review Test Coverage**
   - Aim for 80%+ coverage
   - Focus on critical paths

3. **Fix Flaky Tests**
   - Investigate and fix immediately
   - Use proper waiting strategies

---

## Testing Checklist

### Unit Tests
- [x] Core utility functions tested (cn, color-utils, file-utils)
- [x] Shared package utilities tested (convert-dates, constants)
- [ ] All tRPC procedures tested
- [ ] All React components tested
- [ ] All custom hooks tested
- [ ] All validation schemas tested

### Integration Tests
- [ ] API + Database tests
- [ ] Authentication flow tests
- [ ] Stripe webhook tests
- [ ] File upload tests
- [ ] Redis caching tests

### E2E Tests
- [x] Basic page load tests (example.spec.ts)
- [ ] User registration/login
- [ ] Template creation
- [ ] Template editing
- [ ] Template publishing
- [ ] Library browsing
- [ ] Subscription signup
- [ ] Payment processing

### Regression Tests
- [ ] Previously fixed bugs
- [ ] Critical edge cases
- [ ] Security vulnerabilities

### Performance Tests
- [ ] API response times
- [ ] Page load times
- [ ] Database query performance

### CI/CD
- [x] GitHub Actions workflow
- [x] Unit tests job
- [x] E2E tests job
- [ ] Coverage reporting
- [ ] Test result artifacts

Required GitHub Secrets for E2E tests:
DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
OPENROUTER_API_KEY
TIGRIS_* credentials
UPSTASH_REDIS_* credentials
Optional for remote caching:
TURBO_TOKEN, TURBO_TEAM (vars)
---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing)

---

## Next Steps

1. Review and approve this plan
2. Set up test infrastructure (Phase 1)
3. Begin writing tests incrementally
4. Integrate into CI/CD pipeline
5. Monitor and iterate

---

**Last Updated:** 2025-01-03  
**Status:** Phase 1 Complete - Ready for Phase 2

---

## Progress Summary

### Completed Infrastructure
| Component | Status | Details |
|-----------|--------|---------|
| Vitest | ✅ | v4.0.16 with jsdom/node environments |
| Playwright | ✅ | v1.57 with 3 browser projects |
| RTL | ✅ | v16.3 with jest-dom matchers |
| Test Fixtures | ✅ | User, Template, Organization factories |
| CI/CD | ✅ | GitHub Actions with 3 jobs |

### Test Coverage
| Package | Tests | Status |
|---------|-------|--------|
| apps/web | 36 | ✅ Passing |
| packages/shared | 20 | ✅ Passing |
| packages/api | 42 | ✅ Passing |
| **Total** | **98** | ✅ |

### Test Commands
```bash
pnpm test:web          # Run web app tests
pnpm test:api          # Run API tests  
pnpm test:e2e          # Run E2E tests
pnpm test:coverage     # Run with coverage
```

