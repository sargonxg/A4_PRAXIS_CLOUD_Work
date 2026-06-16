// Client-safe import boundary for ContextCapsule product metadata.
// Prompt 1 moves starter persistence behind Firestore; this boundary keeps
// cockpit imports pointed at a single module while the catalog migrates.
export {
  CAPSULE_ATTACHMENT_ROLES,
  CAPSULE_CONNECTOR_REGISTRY,
  CAPSULE_SLOT_DEFINITIONS,
  CAPSULE_STARTER_CATALOG_VERSION,
  CAPSULE_STARTER_DEFINITIONS,
  CONTEXT_CAPSULE_TEMPLATES,
  CONTEXT_CAPSULE_V3_PRODUCT_SECTIONS,
  CONTEXT_CAPSULE_V3_SHELVES,
  CONTEXT_CAPSULE_V3_TRUST_BADGES,
  HUMAN_GATED_POLICY_JUDGMENT_SEED_FAMILY,
  HUMAN_GATED_POLICY_JUDGMENT_STARTER_IDS,
  MULTILATERAL_SYRIA_FLAGSHIP_STARTER_IDS,
  PENDING_CONTEXT_CAPSULE_OUTPUT_KEY,
  PENDING_CONTEXT_CAPSULE_PATH_KEY,
  PENDING_CONTEXT_CAPSULE_PROMPT_KEY,
  PENDING_CONTEXT_CAPSULE_TEMPLATE_KEY,
  POLICY_PATH_PROFILES,
  POLICY_TEAM_CATEGORIES,
  buildCapsuleTaxonomyStats,
  capsuleAttachmentCounts,
  categoryTagsForPolicyTeam,
  getPolicyTeamCategory,
  normalizeCapsuleTaxonomyTags,
  policyTeamCategoryForTags,
  proposeCapsuleImprovementsFromQualityAudit,
  resolveCapsuleTaxonomy,
  runCapsuleStarterQualityAudit,
} from '@/lib/product/context-capsules';

export type {
  CapsuleConnectorDefinition,
  CapsuleImprovementProposal,
  CapsuleQualityAuditResult,
  CapsuleStarterCategory,
  CapsuleStarterDefinition,
  CapsuleStarterSnapshot,
  CapsuleTaxonomyStats,
  PolicyTeamCategory,
} from '@/lib/product/context-capsules';
