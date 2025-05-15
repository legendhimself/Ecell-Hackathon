/**
 * This file helps with running TypeScript files with ESM imports using ts-node
 * when the project is configured with "type": "module" in package.json.
 */
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'CommonJS',
  },
});
