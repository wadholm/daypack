import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/styled-system/**', '**/.wrangler/**', '**/worker-configuration.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
