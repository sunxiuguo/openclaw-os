import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: { alias: [
    { find: /^@subject\/AppDetail$/, replacement: resolve(process.env.OPENCLAW_REPO ?? here('../openclaw-app-race-20261009'), 'packages/claw-client/src/components/apps/AppDetail.tsx') },
    { find: /^@subject\/MobileAppDetail$/, replacement: resolve(process.env.OPENCLAW_REPO ?? here('../openclaw-app-race-20261009'), 'packages/claw-client/src/components/mobile/MobileAppDetail.tsx') },
    { find: /^react$/, replacement: here('node_modules/react/index.js') },
    { find: /^react\/jsx-runtime$/, replacement: here('node_modules/react/jsx-runtime.js') },
    { find: /^@\//, replacement: here('stubs.tsx') + '?module=' },
    { find: /^@openuidev\/.*/, replacement: here('stubs.tsx') },
    { find: /^lucide-react$/, replacement: here('stubs.tsx') },
    { find: './AppDebugPanel', replacement: here('stubs.tsx') },
  ] },
  test: { environment: 'node' },
});
