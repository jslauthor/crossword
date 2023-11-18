import { PuzzlePreviewProps } from 'components/composed/PuzzlePreview';
import HomePage from 'components/pages/HomePage';
import { getPuzzlesProgressForUser, getUserForClerkId } from 'lib/db';
import { formatDate } from 'lib/utils/date';
import { getPuzzles } from 'lib/utils/reader';
import { currentUser } from '@clerk/nextjs';
import { getCharacterRecord, getProgressFromSolution } from 'lib/utils/puzzle';
import { PuzzleData } from 'types/types';

export default async function Page() {
  const puzzles: (PuzzlePreviewProps & {
    slug: string;
    id: string;
    data: PuzzleData[];
  })[] = (await getPuzzles()).map((puzzle) => ({
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

  const clerkUser = await currentUser();
  if (clerkUser != null) {
    const user = await getUserForClerkId(clerkUser.id);
    if (user != null) {
      // Grab all of the progresses for each of the puzzles for the user
      const progresses = await getPuzzlesProgressForUser(
        user.id,
        puzzles.map((p) => p.id),
      );
      // Update the previewState for each puzzle
      for (const progress of progresses) {
        const puzzle = puzzles.find((p) => p.id === progress.puzzleId);
        if (puzzle != null) {
          puzzle.previewState = getProgressFromSolution(
            getCharacterRecord(puzzle.data),
            progress.data.state,
            progress.data.index,
          );
        }
      }
    }
  }

  return <HomePage puzzles={puzzles} />;
}
