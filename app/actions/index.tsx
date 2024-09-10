'use server';

import webpush from 'web-push';
import { ProgressEnum } from 'components/svg/PreviewCube';
import { currentUser } from '@clerk/nextjs/server';
import { getPuzzlesBySlugs } from 'lib/utils/reader';

webpush.setVapidDetails(
  '<mailto:info@crosscube.app>',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export const getPuzzleProgressesForUser = async (
  userId: string,
  slugs: string[],
): Promise<Record<string, ProgressEnum>> => {
  const user = await currentUser();
  if (user == null || userId !== user.id) {
    return {};
  }

  const puzzles = await getPuzzlesBySlugs(slugs, true);
  return puzzles.reduce(
    (acc, { slug, previewState }) => {
      acc[slug] = previewState;
      return acc;
    },
    {} as Record<string, ProgressEnum>,
  );
};
