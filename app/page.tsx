import { PuzzlePreviewProps } from 'components/composed/PuzzlePreview';
import HomePage from 'components/pages/HomePage';
import { CharacterRecord } from 'lib/utils/puzzle';
import { PuzzleData } from 'types/types';
import { Progress } from '@prisma/client';
import { getPuzzles } from 'lib/utils/reader';

export type PuzzleType = PuzzlePreviewProps & {
  slug: string;
  id: string;
  data: PuzzleData[];
  progress?: Progress;
  answerIndex: number[];
  record: CharacterRecord;
};

export default async function Page() {
  return <HomePage puzzles={await getPuzzles()} />;
}
