import { Mark, mergeAttributes } from '@tiptap/core';

export interface CitationAttrs {
  citationId: string | null;
  sourceType: string | null;
  title: string | null;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    citation: {
      setCitation: (attrs: Partial<CitationAttrs>) => ReturnType;
      unsetCitation: () => ReturnType;
    };
  }
}

export const CitationMark = Mark.create({
  name: 'citation',

  addAttributes() {
    return {
      citationId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-citation-id'),
        renderHTML: (attributes) =>
          attributes.citationId ? { 'data-citation-id': attributes.citationId } : {},
      },
      sourceType: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-source-type'),
        renderHTML: (attributes) =>
          attributes.sourceType ? { 'data-source-type': attributes.sourceType } : {},
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-citation-title'),
        renderHTML: (attributes) =>
          attributes.title ? { 'data-citation-title': attributes.title } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-citation-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class:
          'praxis-citation cursor-pointer rounded bg-sky-50 px-0.5 text-diplomatic-blue underline decoration-diplomatic-blue/40 underline-offset-2',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCitation:
        (attrs) =>
        ({ commands }) =>
          commands.setMark(this.name, attrs),
      unsetCitation:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
