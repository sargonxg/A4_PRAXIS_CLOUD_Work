'use client';

import { AccountProfileButton } from '@/components/app/account-profile-button';
import { HelpAgent } from '@/components/app/help-agent';
import { WelcomeNote } from '@/components/app/welcome-note';

export function SignedInChrome({ showAccountButton }: { showAccountButton: boolean }) {
  return (
    <>
      {showAccountButton ? (
        <div className="fixed right-4 top-4 z-50" data-testid="signed-in-floating-account">
          <AccountProfileButton compact />
        </div>
      ) : null}
      <WelcomeNote />
      <HelpAgent />
    </>
  );
}
