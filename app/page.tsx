import { PuzzlePreviewProps } from 'components/composed/PuzzlePreview';
import HomePage from 'components/pages/HomePage';
import { getPuzzlesProgressForUser, getUserForClerkId } from 'lib/db';
import { formatDate } from 'lib/utils/date';
import { enrichPuzzlesWithProgress, getPuzzles } from 'lib/utils/reader';
import { currentUser } from '@clerk/nextjs';
import { getCharacterRecord, getProgressFromSolution } from 'lib/utils/puzzle';
import { PuzzleData } from 'types/types';
import { Progress } from '@prisma/client';

export type PuzzleType = PuzzlePreviewProps & {
  slug: string;
  id: string;
  data: PuzzleData[];
  progress?: Progress;
};

export default async function Page() {
  const puzzles: PuzzleType[] = (await getPuzzles()).map((puzzle) => ({
    id: puzzle.id,
    title: puzzle.title,
    author: puzzle.author.fullName,
    date: formatDate(puzzle._firstPublishedAt),
    isAiAssisted: puzzle.isAiAssisted,
    difficulty: puzzle.difficulty,
    previewState: 0,
    slug: puzzle.slug,
    data: puzzle.data,
  }));

  return <HomePage puzzles={await enrichPuzzlesWithProgress(puzzles)} />;
}
