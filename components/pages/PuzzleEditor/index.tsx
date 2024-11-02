'use client';

import Menu from 'components/containers/Menu';
import EmojiSelector from 'components/core/EmojiSelector';
import { useRouter } from 'next/navigation';
import React, { useCallback } from 'react';

export function PuzzleEditor() {
  return (
    <>
      <Menu>
        <EmojiSelector className="h-[500px]" />
      </Menu>
    </>
  );
}
