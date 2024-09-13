import { redirect } from 'next/navigation';
import { getPuzzles } from 'lib/utils/reader';
import { CrosscubeType } from 'types/types';

export default async function LatestPuzzleRedirect({
  params: { type },
}: {
  params: { type: CrosscubeType };
}) {
  const puzzles = await getPuzzles(false, [type], 1);

  if (puzzles.length > 0) {
    redirect(`/puzzle/${puzzles[0].slug}`);
  } else {
    redirect(`/crosscube/${type}`);
  }
}
