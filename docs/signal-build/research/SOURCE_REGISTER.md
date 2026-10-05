# Additional primary-source register

Checked 5 October 2026. These 23 references support the research supplement. The original product blueprint retains its own numbered register in `docs/PROJECT.md`; R identifiers refer only to this supplement. Provider documentation and terms can change. Access to documentation is not a live connector test or a licence grant.

The ZIP contains summaries, original design instructions and synthetic fixtures. It does not include third-party articles, benchmark datasets or model weights. All architecture and commercial recommendations are SIGNAL design judgments unless explicitly attributed.

| ID | Source | Application |
| --- | --- | --- |
| R01 | [SemEval-2023 Task 3 overview](https://aclanthology.org/2023.semeval-1.317/) - ACL Anthology | Genre, framing and persuasion are distinct tasks; not a truth or intent test. |
| R02 | [Google text embedding model documentation](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/embeddings/get-text-embeddings) - Google Cloud | Check current multilingual models and pin the model/task/index configuration. |
| R03 | [multilingual-e5-base model card](https://huggingface.co/intfloat/multilingual-e5-base) - intfloat | Optional MIT retrieval baseline; benchmark separately before adoption. |
| R04 | [BERTopic online topic modeling](https://maartengr.github.io/BERTopic/getting_started/online/online.html) - BERTopic | Incremental topic modeling; stable narrative identity remains an application responsibility. |
| R05 | [BERTopic topics over time](https://maartengr.github.io/BERTopic/getting_started/topicsovertime/topicsovertime.html) - BERTopic | Topic evolution is an exploratory component, not verified political interpretation. |
| R06 | [ACLED end user licence agreement](https://acleddata.com/eula) - ACLED | Commercial entitlement is required; optional connector remains disabled. |
| R07 | [ACLED content usage terms](https://acleddata.com/contentusage) - ACLED | AI-related processing and derived outputs must fit the actual entitlement. |
| R08 | [UCDP API documentation](https://ucdp.uu.se/apidocs/index.html) - Uppsala University | Token, dataset version, pagination and provider-specific filters require explicit handling. |
| R09 | [UCDP dataset downloads](https://ucdp.uu.se/downloads/) - Uppsala University | Dataset cadence/definitions are separate from media evidence and commercial rights. |
| R10 | [Media Cloud frequently asked questions](https://www.mediacloud.org/documentation/faqs) - Media Cloud | URL discovery does not provide distributable actual story text; quotas are account-dependent. |
| R11 | [ReliefWeb API parameters](https://apidoc.reliefweb.int/parameters) - ReliefWeb/OCHA | Use the current approved-appname process and verify document capture terms. |
| R12 | [NLLB-200 distilled 600M model card](https://huggingface.co/facebook/nllb-200-distilled-600M) - Meta | Non-commercial checkpoint is excluded from the default commercial model plan. |
| R13 | [Arabic propaganda detection shared-task overview](https://aclanthology.org/2022.wanlp-1.11/) - ACL Anthology/WANLP | Arabic technique/span evaluation reference; not an authorization to redistribute its data. |
| R14 | [MIRACL multilingual retrieval benchmark](https://aclanthology.org/2023.tacl-1.63/) - ACL Anthology/TACL | Multilingual retrieval reference; does not measure geopolitical judgment. |
| R15 | [Codex developer commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli) - OpenAI | Portable launcher uses documented working-directory and additional-directory options. |
| R16 | [Sentence Transformers semantic search](https://sbert.net/examples/sentence_transformer/applications/semantic-search/README.html) - Sentence Transformers | Query/document encodings and retrieval task configuration must be compatible. |
| R17 | [Web Annotation Data Model](https://www.w3.org/TR/annotation-model/) - W3C | Quote/position selectors inform evidence locators; SIGNAL explicitly declares its offset units. |
| R18 | [Inline bidirectional text markup](https://www.w3.org/International/articles/inline-bidi-markup/) - W3C | Original multilingual evidence needs correct direction and inline isolation. |
| R19 | [PostgreSQL range types](https://www.postgresql.org/docs/current/rangetypes.html) - PostgreSQL | Optional interval storage if the current evidence plane uses PostgreSQL. |
| R20 | [geoBoundaries](https://www.geoboundaries.org/) - geoBoundaries | Versioned, attribution-bearing geometry; pin release and geopolitical policy. |
| R21 | [GDELT DOC 2.0 API announcement](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) - GDELT | Discovery caps and publisher-country operators need adapter handling; probe the live endpoint. |
| R22 | [GDELT DOC/GEO search update](https://blog.gdeltproject.org/doc-geo-2-0-api-updates-full-year-searching-and-more/) - GDELT | Historical search-window update is not a current availability guarantee. |
| R23 | [DISARM framework](https://www.disarm.foundation/framework) - DISARM Foundation | Optional technique vocabulary; matching a tactic does not identify an operator. |

Machine-readable companion: [source-register.json](source-register.json). Read source terms directly before enabling an adapter or downloading an evaluation dataset. Preserve the checked date and verify provider changes during the relevant build phase.
