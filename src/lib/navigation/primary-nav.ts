export const PRIMARY_NAV = [
  { id: 'ask', label: 'Ask', icon: 'Sparkles', href: '/app/assistant', shortcut: '/' },
  { id: 'cores', label: 'Cores', icon: 'FolderKanban', href: '/app/contexts', shortcut: 'g c' },
  { id: 'write', label: 'Write', icon: 'FileText', href: '/app/write', shortcut: 'g w' },
  { id: 'tools', label: 'Tools', icon: 'Wrench', href: '/app/tools', shortcut: 'g t' },
  { id: 'settings', label: 'Settings', icon: 'Settings', href: '/app/settings', shortcut: 'g s' },
] as const;

export type PrimaryNavItem = (typeof PRIMARY_NAV)[number];
export type PrimaryNavId = PrimaryNavItem['id'];

export function primaryNavForPath(pathname: string): PrimaryNavItem | null {
  return PRIMARY_NAV.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? null;
}
