import { currentUser } from '@clerk/nextjs';
import { CrosscubeType, PuzzleType } from 'types/types';
import { queryDato } from 'lib/dato';
import { getPuzzlesProgressForUser, getUserForClerkId } from 'lib/db';
import {
  updateAnswerIndex,
  getCharacterRecord,
  getProgressFromSolution,
  invertAtlas,
  initializeAnswerIndex,
  GAME_STATE_KEY,
} from './puzzle';
import { formatDate } from 'lib/utils/date';
import { TEXTURE_RECORD } from './textures';
import * as Y from 'yjs';

export const getPuzzles = async (
  types: CrosscubeType[] = ['cube', 'mega', 'mini', 'moji'],
  first: number = 100,
  skip: number = 0,
): Promise<PuzzleType[]> => {
  try {
    const result = await queryDato({
      query: `
        {
          allPuzzles(
            first: ${first},
            skip: ${skip},
            orderBy: _firstPublishedAt_DESC
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
            svgsegments
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

    return await enrichPuzzles(puzzles);
  } catch (error) {
    console.error('Error calling dato!', error);
  }

  return [];
};

export const getPuzzleBySlug = async (
  slug: string,
): Promise<PuzzleType | null> => {
  try {
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
            svgsegments
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
    await enrichPuzzles([puzzle]);

    return puzzle;
  } catch (error) {
    console.error('Error calling dato!', error);
  }

  return null;
};

export const getPuzzleById = async (id: string): Promise<PuzzleType | null> => {
  const result = await queryDato({
    query: `
      {
        allPuzzles(
          filter: {
            id: { eq: "${id}" }
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
          svgsegments
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
  await enrichPuzzles([puzzle]);

  return puzzle;
};

const atlas = invertAtlas(TEXTURE_RECORD);

// WARNING: This mutates the puzzles that are passed in
export const enrichPuzzles = async (puzzles: PuzzleType[]) => {
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
          const doc = new Y.Doc();
          const state = Buffer.from(progress.state);
          Y.applyUpdateV2(doc, state);
          const positions = Float32Array.from(
            doc.getMap(GAME_STATE_KEY).get('characterPositions') as number[],
          );
          const index = updateAnswerIndex(
            initializeAnswerIndex(puzzle.record.solution),
            atlas,
            positions,
            puzzle.record.solution,
          );
          puzzle.previewState = getProgressFromSolution(
            puzzle,
            positions,
            index,
          );
        }
      }
    }
  }

  return puzzles;
};
