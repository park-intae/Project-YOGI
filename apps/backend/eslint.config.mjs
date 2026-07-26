// @ts-check
import tseslint from 'typescript-eslint';
import { nestConfig } from '@yogi/eslint-config/nest.mjs';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  ...nestConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
