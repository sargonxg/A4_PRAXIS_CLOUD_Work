/**
 * PRAXIS navigation map.
 *
 * The visible PRAXIS app is one cockpit route: /app, centered on the
 * capsule manager. Pricing and release notes stay public routes.
 */

export type PrimaryNavIcon =
  | 'Home'
  | 'Sparkles'
  | 'FolderKanban'
  | 'LibraryBig'
  | 'FileText'
  | 'Network'
  | 'Wrench'
  | 'Settings'
  | 'Boxes'
  | 'ShieldCheck'
  | 'Cog';

export interface PrimaryNavItem {
  id: string;
  label: string;
  icon: PrimaryNavIcon;
  href: string;
  shortcut?: string;
  /** Brief description shown when sidebar is expanded. */
  hint?: string;
}

export interface PrimaryNavGroup {
  id: 'workspace' | 'advanced' | 'administration';
  label: string;
  defaultOpen: boolean;
  /** Only render this group when the current user is an admin. */
  adminOnly?: boolean;
  items: readonly PrimaryNavItem[];
}

export const NAV_GROUPS: readonly PrimaryNavGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    defaultOpen: true,
    items: [
      { id: 'home', label: 'Home', icon: 'Home', href: '/app', shortcut: 'g h', hint: 'Ask from the active capsule' },
      { id: 'capsules', label: 'Capsules', icon: 'FolderKanban', href: '/app/capsules', shortcut: 'g c', hint: 'Manage capsule library, sources, and documents' },
    ],
  },
] as const;

/** Flat list of every nav item — used for keyboard shortcuts + path matching. */
export const PRIMARY_NAV: readonly PrimaryNavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export type PrimaryNavId = PrimaryNavItem['id'];

export function primaryNavForPath(pathname: string): PrimaryNavItem | null {
  // Prefer the longest matching href so that nested routes like
  // /app/admin/users resolve to "Users" rather than "Console".
  let best: PrimaryNavItem | null = null;
  let bestLen = -1;
  for (const item of PRIMARY_NAV) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      if (item.href.length > bestLen) {
        best = item;
        bestLen = item.href.length;
      }
    }
  }
  return best;
}
