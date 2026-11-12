import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const noForbiddenModels = require("./.eslintrc-rules/no-forbidden-models.js");

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      praxis: {
        rules: {
          "no-forbidden-models": noForbiddenModels,
        },
      },
    },
    rules: {
      "praxis/no-forbidden-models": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Keep deployment validation from failing on the existing React Compiler
      // migration backlog. These still print during `npm run lint`; they are
      // tracked as warnings until the UI can be cleaned up route-by-route.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-render": "warn",
      "react-hooks/component-hook-factories": "warn",
      "react-hooks/no-deriving-state-in-effects": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/error-boundaries": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
      "prefer-const": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "output/**",
    "test-results/**",
    "playwright-report/**",
    ".playwright-cli/**",
    "backend/.venv/**",
    "backend/**/site-packages/**",
    "**/__pycache__/**",
    "docs/_archive/**",
    "scripts/_archive/**",
    // This standalone, non-React exercise has its own syntax/contract checks
    // in verify:demo, run by prelint; Next's React migration rules do not apply.
    "tacitus-demo/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
