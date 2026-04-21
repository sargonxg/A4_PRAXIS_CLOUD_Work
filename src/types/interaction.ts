export interface InteractionFrame {
  recentTools: Array<{ toolId: string; ranAt: string; summary: string }>;
  /** Count of situations the user currently has in status:'draft'. */
  activeSituationDrafts: number;
}
