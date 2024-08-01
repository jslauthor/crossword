'use server';

import { ProgressEnum } from 'components/svg/PreviewCube';
import { currentUser } from '@clerk/nextjs/server';
import { getPuzzlesBySlugs } from 'lib/utils/reader';

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
