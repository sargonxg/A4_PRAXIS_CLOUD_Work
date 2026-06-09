/**
 * PRAXIS navigation map.
 *
 * The visible PRAXIS app keeps the cockpit surfaces in one route registry so
 * the sidebar, launchpad, shortcuts, and breadcrumbs cannot drift apart.
 */

export type PrimaryNavIcon =
  | 'Home'
  | 'MessageSquareText'
  | 'Sparkles'
  | 'FolderKanban'
  | 'LibraryBig'
  | 'Library'
  | 'BriefcaseBusiness'
  | 'FileText'
  | 'BookOpen'
  | 'History'
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
  /** Optional alternate path prefixes for query-backed or nested surfaces. */
  matchPaths?: readonly string[];
  shortcut?: string;
  /** Brief description shown when sidebar is expanded. */
  hint?: string;
}

export interface PrimaryNavGroup {
  id: 'workspace' | 'knowledge' | 'advanced' | 'administration';
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
      { id: 'home', label: 'Home', icon: 'MessageSquareText', href: '/app', shortcut: 'g h', hint: 'Ask from the active capsule' },
      { id: 'capsules', label: 'Capsules', icon: 'FolderKanban', href: '/app/capsules', shortcut: 'g c', hint: 'Manage, improve, source, and download reusable capsules' },
      { id: 'boardroom', label: 'Boardroom', icon: 'ShieldCheck', href: '/app/boardroom', shortcut: 'g b', hint: 'Run a chaired multi-lens discussion' },
      { id: 'recent-work', label: 'Recent work', icon: 'FileText', href: '/app/recent-work', shortcut: 'g r', hint: 'Reopen generated work and saved artifacts' },
    ],
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    defaultOpen: true,
    items: [
      {
        id: 'marketplace',
        label: 'Marketplace',
        icon: 'BriefcaseBusiness',
        href: '/app/capsules?lane=marketplace',
        hint: 'Start from verified capsule patterns',
      },
      { id: 'settings', label: 'Settings', icon: 'Settings', href: '/app/settings', shortcut: 'g s', hint: 'Profile, billing, system posture' },
    ],
  },
] as const;

/** Flat list of every nav item — used for keyboard shortcuts + path matching. */
export const PRIMARY_NAV: readonly PrimaryNavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export type PrimaryNavId = PrimaryNavItem['id'];

export const PUBLIC_NAV_ITEMS = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'pricing', label: 'Pricing', href: '/pricing' },
  { id: 'learn', label: 'Learn', href: '/learn' },
  { id: 'guide', label: 'Guide', href: '/guide' },
  { id: 'release-notes', label: 'Release notes', href: '/release-notes' },
] as const;

export const PUBLIC_FOOTER_LINKS = [
  { label: 'Privacy', href: '/legal/privacy' },
  { label: 'Cookies', href: '/legal/cookies' },
  { label: 'GDPR', href: '/legal/gdpr' },
  { label: 'DPA', href: '/legal/data-processing' },
  { label: 'Terms', href: '/legal/terms' },
  { label: 'Security', href: '/legal/security' },
  { label: 'Sub-processors', href: '/legal/sub-processors' },
  { label: 'Data retention', href: '/legal/data-retention' },
] as const;

export const ROUTE_LABELS: readonly { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/app', label: 'PRAXIS' },
  { href: '/learn', label: 'Learn' },
  { href: '/guide', label: 'Guide' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/release-notes', label: 'Release notes' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/help', label: 'Help' },
  { href: '/legal', label: 'Legal' },
  ...PRIMARY_NAV.map((item) => ({ href: item.href, label: item.label })),
];

export const APP_LAUNCHPAD_NAV = [
  ...PRIMARY_NAV,
  { id: 'learn', label: 'Learn', icon: 'BookOpen', href: '/learn' },
  { id: 'release-notes', label: 'Release notes', icon: 'History', href: '/release-notes' },
] satisfies readonly PrimaryNavItem[];

export function normalizeRouteHref(href: string): string {
  return href.split(/[?#]/)[0] || '/';
}

export function itemMatchesPath(item: Pick<PrimaryNavItem, 'href' | 'matchPaths'>, pathname: string): boolean {
  const href = normalizeRouteHref(item.href);
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  return Boolean(item.matchPaths?.some((match) => {
    const normalized = normalizeRouteHref(match);
    return pathname === normalized || pathname.startsWith(`${normalized}/`);
  }));
}

export function primaryNavForPath(pathname: string): PrimaryNavItem | null {
  // Prefer the longest matching href so that nested routes like
  // /app/admin/users resolve to "Users" rather than "Console".
  let best: PrimaryNavItem | null = null;
  let bestLen = -1;
  for (const item of PRIMARY_NAV) {
    const href = normalizeRouteHref(item.href);
    if (itemMatchesPath(item, pathname)) {
      if (href.length > bestLen) {
        best = item;
        bestLen = href.length;
      }
    }
  }
  return best;
}

function humanizeSegment(segment: string): string {
  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function routeLabelForPath(pathname: string, segment?: string): string {
  const direct = ROUTE_LABELS.find((route) => normalizeRouteHref(route.href) === pathname);
  if (direct) return direct.label;
  const primary = primaryNavForPath(pathname);
  if (primary) return primary.label;
  return segment ? humanizeSegment(segment) : humanizeSegment(pathname.split('/').filter(Boolean).at(-1) ?? 'home');
}

export function breadcrumbsForPath(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let currentPath = '';

  for (const segment of segments) {
    currentPath += `/${segment}`;
    crumbs.push({ label: routeLabelForPath(currentPath, segment), href: currentPath });
  }

  return crumbs;
}
