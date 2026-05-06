const FORBIDDEN = /gemini-(2\.0|3-pro-preview)|claude-|gpt-|firecrawl|tavily|parallel-web/i;

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
        const file = context.getFilename().replace(/\\/g, '/');
        if (file.endsWith('/src/lib/ai/providers.ts')) return;
        context.report({
          node,
          message: `Forbidden string "${node.value}" outside providers.ts`,
        });
      },
      TemplateElement(node) {
        const value = node.value.raw;
        if (!FORBIDDEN.test(value)) return;
        const file = context.getFilename().replace(/\\/g, '/');
        if (file.endsWith('/src/lib/ai/providers.ts')) return;
        context.report({
          node,
          message: `Forbidden string "${value}" outside providers.ts`,
        });
      },
    };
  },
};
