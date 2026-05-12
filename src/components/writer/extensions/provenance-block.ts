import { Extension } from '@tiptap/core';

export const ProvenanceBlock = Extension.create({
  name: 'provenanceBlock',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'listItem'],
        attributes: {
          provenanceCore: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-provenance-core'),
            renderHTML: (attributes) =>
              attributes.provenanceCore ? { 'data-provenance-core': attributes.provenanceCore } : {},
          },
          provenanceTool: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-provenance-tool'),
            renderHTML: (attributes) =>
              attributes.provenanceTool ? { 'data-provenance-tool': attributes.provenanceTool } : {},
          },
          confidence: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-confidence'),
            renderHTML: (attributes) =>
              attributes.confidence ? { 'data-confidence': attributes.confidence } : {},
          },
        },
      },
    ];
  },
});
