/**
 * PRAXIS navigation map.
 *
 * The sidebar keeps the visible product contract small:
 * Home, Ask PRAXIS, Library, Memo Studio, Canvas, and Advanced.
 * Core builders, diagnostics, ACH, Boardroom, and specialist tools stay
 * reachable through those surfaces instead of becoming competing nav areas.
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
      { id: 'home', label: 'Home', icon: 'Home', href: '/app/dashboard', shortcut: 'g h', hint: 'Choose or create context, then ask' },
      { id: 'ask', label: 'Ask PRAXIS', icon: 'Sparkles', href: '/app/assistant', shortcut: '/', hint: 'Reason from the active capsule' },
      { id: 'library', label: 'Library', icon: 'LibraryBig', href: '/app/workbench', shortcut: 'g l', hint: 'Upload sources and documents into knowledge cores' },
      { id: 'write', label: 'Memo Studio', icon: 'FileText', href: '/app/write', shortcut: 'g m', hint: 'Draft from the active context' },
      { id: 'canvas', label: 'Canvas', icon: 'Network', href: '/app/canvas', shortcut: 'g v', hint: 'Inspect or arrange context when needed' },
      { id: 'advanced', label: 'Advanced', icon: 'Wrench', href: '/app/tools', shortcut: 'g a', hint: 'Detailed tools, diagnostics, graph, ACH, and settings' },
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
      { id: 'settings', label: 'Settings', icon: 'Cog', href: '/app/settings', hint: 'API keys, models, notifications' },
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
