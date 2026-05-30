import { Mark, mergeAttributes } from '@tiptap/core';

export interface CitationMarkAttrs {
  sourceId: string | null;
  claimId: string | null;
  sourceTitle: string | null;
  url: string | null;
}

export const CitationMark = Mark.create({
  name: 'citation',

  addAttributes() {
    return {
      sourceId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-source-id'),
        renderHTML: (attributes) => ({ 'data-source-id': attributes.sourceId }),
      },
      claimId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-claim-id'),
        renderHTML: (attributes) => ({ 'data-claim-id': attributes.claimId }),
      },
      sourceTitle: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-source-title'),
        renderHTML: (attributes) => ({ 'data-source-title': attributes.sourceTitle }),
      },
      url: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-source-url'),
        renderHTML: (attributes) => ({ 'data-source-url': attributes.url }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-source-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'rounded-sm bg-amber-50 px-0.5 text-slate-900 underline decoration-amber-500/60 underline-offset-2',
        'data-citation': 'true',
      }),
      0,
    ];
  },
});
