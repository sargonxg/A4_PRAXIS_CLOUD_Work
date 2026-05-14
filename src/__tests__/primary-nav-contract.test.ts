import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRIMARY_NAV, primaryNavForPath } from '@/lib/navigation/primary-nav';

const repoRoot = path.resolve(__dirname, '../..');

const expectedSidebarItems = [
  { label: 'Ask PRAXIS', href: '/app/assistant', shortcut: '/' },
  { label: 'Cores', href: '/app/contexts', shortcut: 'g c' },
  { label: 'Library', href: '/app/workbench', shortcut: 'g l' },
  { label: 'Memo Studio', href: '/app/write', shortcut: 'g m' },
  { label: 'Home', href: '/app/dashboard', shortcut: 'g h' },
  { label: 'Canvas', href: '/app/canvas', shortcut: 'g v' },
  { label: 'Tools', href: '/app/tools', shortcut: 'g a' },
];

describe('primary sidebar navigation contract', () => {
  it('keeps the visible workspace and advanced items wired to existing app routes', () => {
    for (const expected of expectedSidebarItems) {
      const item = PRIMARY_NAV.find((navItem) => navItem.label === expected.label);
      expect(item).toMatchObject(expected);

      const route = item?.href.replace('/app/', '');
      expect(route).toBeTruthy();
      expect(existsSync(path.join(repoRoot, 'src/app/app', route!, 'page.tsx'))).toBe(true);
    }
  });

  it('matches nested routes to the longest sidebar href', () => {
    expect(primaryNavForPath('/app/workbench/case-1')?.label).toBe('Library');
    expect(primaryNavForPath('/app/write/draft-1')?.label).toBe('Memo Studio');
    expect(primaryNavForPath('/app/tools/archive')?.label).toBe('Tools');
  });
});
