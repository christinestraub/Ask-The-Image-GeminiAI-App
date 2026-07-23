```markdown
# Ask-The-Image-GeminiAI-App Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development patterns and workflows used in the Ask-The-Image-GeminiAI-App repository. The project is built with TypeScript and Next.js, following clear conventions for file naming, imports, exports, commit messages, and testing. By following these patterns, you can contribute code that is consistent, maintainable, and easy to review.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `imageProcessor.ts`, `askGeminiApi.ts`

### Import Style
- Use **alias imports** for modules.
  - Example:
    ```typescript
    import { processImage } from '@/utils/imageProcessor';
    ```

### Export Style
- Use **named exports**.
  - Example:
    ```typescript
    // In askGeminiApi.ts
    export function askGemini(image: Buffer): Promise<string> { ... }
    ```

### Commit Messages
- Use **conventional commits** with the `feat` prefix for new features.
- Keep commit messages concise (average 35 characters).
  - Example:
    ```
    feat: add image upload endpoint
    ```

## Workflows

### Feature Development
**Trigger:** When adding a new feature  
**Command:** `/feature-development`

1. Create a new branch for your feature.
2. Implement the feature in camelCase-named files.
3. Use alias imports and named exports.
4. Write or update tests in `*.test.ts` files.
5. Commit changes using the `feat` prefix.
6. Open a pull request for review.

### Testing
**Trigger:** When you need to verify code correctness  
**Command:** `/run-tests`

1. Write tests in files matching `*.test.ts`.
2. Use the `vitest` framework.
3. Run tests with:
    ```bash
    npx vitest run
    ```
4. Ensure all tests pass before merging.

## Testing Patterns

- All tests are written in TypeScript files ending with `.test.ts`.
- The `vitest` testing framework is used.
- Example test file:
    ```typescript
    // imageProcessor.test.ts
    import { processImage } from '@/utils/imageProcessor';

    test('processImage returns expected output', () => {
      const result = processImage(sampleInput);
      expect(result).toBe(expectedOutput);
    });
    ```

## Commands
| Command              | Purpose                                 |
|----------------------|-----------------------------------------|
| /feature-development | Start a new feature development workflow|
| /run-tests           | Run all tests using vitest              |
```
