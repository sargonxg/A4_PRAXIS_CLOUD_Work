export const PRIMARY_NAV = [
  { id: 'home', label: 'Home', icon: 'Home', href: '/app/dashboard', shortcut: 'g h' },
  { id: 'ask', label: 'Ask PRAXIS', icon: 'Sparkles', href: '/app/assistant', shortcut: '/' },
  { id: 'library', label: 'Library', icon: 'LibraryBig', href: '/app/contexts', shortcut: 'g l' },
  { id: 'write', label: 'Memo Studio', icon: 'FileText', href: '/app/write', shortcut: 'g m' },
  { id: 'canvas', label: 'Canvas', icon: 'Network', href: '/app/canvas', shortcut: 'g v' },
  { id: 'advanced', label: 'Advanced', icon: 'Wrench', href: '/app/tools', shortcut: 'g a' },
] as const;

export type PrimaryNavItem = (typeof PRIMARY_NAV)[number];
export type PrimaryNavId = PrimaryNavItem['id'];

export function primaryNavForPath(pathname: string): PrimaryNavItem | null {
  return PRIMARY_NAV.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? null;
}
