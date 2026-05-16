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
      { id: 'capsules', label: 'Capsules', icon: 'FolderKanban', href: '/app', shortcut: 'g c', hint: 'Manage capsule library, sources, and documents' },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    defaultOpen: false,
    adminOnly: true,
    items: [
      { id: 'admin-home', label: 'Console', icon: 'ShieldCheck', href: '/app/admin', hint: 'Operator console, audit & invariants' },
      { id: 'admin-users', label: 'Users', icon: 'FolderKanban', href: '/app/admin/users', hint: 'Identity, plan tier, credits' },
      { id: 'admin-advisors', label: 'Advisors', icon: 'Sparkles', href: '/app/admin/advisors', hint: 'Persona library + feed control' },
      { id: 'admin-domains', label: 'Domains', icon: 'Boxes', href: '/app/admin/domains', hint: 'Domain taxonomy + lens weights' },
      { id: 'admin-diag', label: 'Diagnostics', icon: 'Network', href: '/app/admin/diagnostics', hint: 'System health + invariants' },
      { id: 'settings', label: 'Settings', icon: 'Cog', href: '/app', hint: 'Runtime settings inside the PRAXIS cockpit' },
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
