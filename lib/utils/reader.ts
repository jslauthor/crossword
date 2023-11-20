import { currentUser } from '@clerk/nextjs';
import { PuzzleType } from 'app/page';
import { queryDato } from 'lib/dato';
import { getPuzzlesProgressForUser, getUserForClerkId } from 'lib/db';
import { getCharacterRecord, getProgressFromSolution } from './puzzle';
import { formatDate } from 'lib/utils/date';

export const getPuzzles = async (
  first: number = 100,
  skip: number = 0,
): Promise<PuzzleType[]> => {
  const result = await queryDato({
    query: `
      {
        allPuzzles(
          first: ${first},
          skip: ${skip},
          orderBy: _firstPublishedAt_ASC
        ) {
          id
          difficulty
          puzzleType
          data
          author {
            fullName
          }
          isAiAssisted
          slug
          title
          _status
          _firstPublishedAt
        }

        _allPuzzlesMeta {
          count
        }
      }
    `,
  });

  const puzzles: PuzzleType[] = result?.allPuzzles.map((puzzle: any) => ({
    id: puzzle.id,
    title: puzzle.title,
    author: puzzle.author.fullName,
    date: formatDate(puzzle._firstPublishedAt),
    isAiAssisted: puzzle.isAiAssisted,
    difficulty: puzzle.difficulty,
    previewState: 0,
    slug: puzzle.slug,
    data: puzzle.data,
    record: getCharacterRecord(puzzle.data),
  }));

  return await enrichPuzzlesWithProgress(puzzles);
};

export const getPuzzleBySlug = async (
  slug: string,
): Promise<PuzzleType | null> => {
  const result = await queryDato({
    query: `
      {
        allPuzzles(
          filter: {
            slug: { eq: "${slug}" }
          }
        ) {
          id
          difficulty
          puzzleType
          data
          author {
            fullName
          }
          isAiAssisted
          slug
          title
          _status
          _firstPublishedAt
        }
      }
    `,
  });

  const puzzle = result?.allPuzzles[0];

  if (puzzle == null) {
    return puzzle;
  }

  puzzle.record = getCharacterRecord(puzzle.data);
  await enrichPuzzlesWithProgress([puzzle]);

  return puzzle;
};

// WARNING: This mutates the puzzles that are passed in
export const enrichPuzzlesWithProgress = async (puzzles: PuzzleType[]) => {
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
          puzzle.progress = progress;
        }
      }
    }
  }

  return puzzles;
};
