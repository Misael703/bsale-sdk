import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Tests de tipos (`*.test-d.ts`): los chequea tsc como parte de `vitest run`.
    typecheck: {
      enabled: true,
      include: ['tests/**/*.test-d.ts'],
      // tsconfig.json excluye `tests/`; sin este tsconfig los .test-d.ts no se chequean.
      tsconfig: './tsconfig.test.json',
    },
  },
});
