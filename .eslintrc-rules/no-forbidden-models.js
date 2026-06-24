const FORBIDDEN = /gemini-(2\.0|3-pro-preview)|claude-|gpt-|firecrawl|tavily|parallel-web/i;

// Files allowed to contain the forbidden strings: providers.ts is the single
// source of truth for model IDs, and the model-matrix coverage audit + its test
// are the legitimate detectors that must reference the forbidden patterns.
const ALLOWED = [
  '/src/lib/ai/providers.ts',
  '/scripts/audit-model-matrix-coverage.ts',
  '/tests/unit/scripts/model-matrix-coverage-audit.test.ts',
];

function isAllowedFile(context) {
  const file = context.getFilename().replace(/\\/g, '/');
  return ALLOWED.some((allowed) => file.endsWith(allowed));
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow retired model strings and removed provider names outside providers.ts',
    },
    schema: [],
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value !== 'string' || !FORBIDDEN.test(node.value)) return;
        if (isAllowedFile(context)) return;
        context.report({
          node,
          message: `Forbidden string "${node.value}" outside providers.ts`,
        });
      },
      TemplateElement(node) {
        const value = node.value.raw;
        if (!FORBIDDEN.test(value)) return;
        if (isAllowedFile(context)) return;
        context.report({
          node,
          message: `Forbidden string "${value}" outside providers.ts`,
        });
      },
    };
  },
};
