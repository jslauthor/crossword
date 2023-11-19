import { currentUser } from '@clerk/nextjs';
import { PuzzleType } from 'app/page';
import { DifficultyEnum } from 'components/svg/IconStar';
import { queryDato } from 'lib/dato';
import { getPuzzlesProgressForUser, getUserForClerkId } from 'lib/db';
import { PuzzleData } from 'types/types';
import { getCharacterRecord, getProgressFromSolution } from './puzzle';

export const getPuzzles = async (
  first: number = 100,
  skip: number = 0,
): Promise<
  {
    id: string;
    difficulty: DifficultyEnum;
    puzzleType: string;
    data: PuzzleData[];
    author: { fullName: string };
    isAiAssisted: boolean;
    title: string;
    slug: string;
    _firstPublishedAt: string;
  }[]
> => {
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

  return result?.allPuzzles;
};

export const getPuzzleBySlug = async (slug: string) => {
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

  return result?.allPuzzles[0];
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
