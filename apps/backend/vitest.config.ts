import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://yogi_user:yogi_password@localhost:5432/yogi_db?schema=public';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.{test,spec}.ts', '../../antigravity/**/*.{test,spec}.ts', 'test/**/*.e2e-spec.ts'],
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
