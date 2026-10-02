/** Programmatic shell navigation shares the current editor's unsaved-work gate. */
export function canLeaveWorkspaceEditor(): boolean {
  return typeof window === 'undefined' || window.dispatchEvent(new Event('praxis-before-workspace-navigation', { cancelable: true }));
}
