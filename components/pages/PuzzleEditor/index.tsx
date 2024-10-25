'use client';

import Menu from 'components/containers/Menu';
import EmojiSelector from 'components/core/EmojiSelector';
import { useRouter } from 'next/navigation';
import React, { useCallback } from 'react';

export function PuzzleEditor() {
  const router = useRouter();

  const onSignIn = useCallback(() => {
    router.push(`/signin?redirect_url=${window.location.href}`);
  }, [router]);

  return (
    <>
      <Menu onSignInPressed={onSignIn}>
        <EmojiSelector className="h-[500px]" />
      </Menu>
    </>
  );
}
