export interface InteractionFrame {
  recentTools: Array<{ toolId: string; ranAt: string; summary: string }>;
  activeSituationDrafts: number;
}
