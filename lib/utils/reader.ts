import { currentUser } from '@clerk/nextjs';
import { CrosscubeType, PuzzleType } from 'types/types';
import { getPuzzlesProgressForUser, getUserForClerkId } from 'lib/db';
import {
  updateAnswerIndex,
  getCharacterRecord,
  getProgressFromSolution,
  invertAtlas,
  initializeAnswerIndex,
  GAME_STATE_KEY,
} from './puzzle';
import { TEXTURE_RECORD } from './textures';
import * as Y from 'yjs';
import { queryReadOnly } from 'lib/hygraph';

const createWhereForType = (types: CrosscubeType[]) => {
  return types
    .map((type) => {
      switch (type) {
        case 'cube':
          return '(@.dimensions.width == 8 && @.dimensions.height == 8)';
        case 'mega':
          return '(@.dimensions.width == 12 && @.dimensions.height == 12)';
        case 'mini':
          return '(@.dimensions.width == 5 && @.dimensions.height == 5)';
        case 'moji':
          return '(@.dimensions.width == 3 && @.dimensions.height == 3)';
        default:
          return '';
      }
    })
    .join(' || ');
};

export const getPuzzles = async (
  types: CrosscubeType[] = ['cube', 'mega', 'mini', 'moji'],
): Promise<PuzzleType[]> => {
  try {
    const fetchAllCrosscubes = async () => {
      let allCrosscubes: any = [];
      let hasNextPage = true;
      let after = null;

      while (hasNextPage) {
        const result: any = await queryReadOnly<{
          crosscubesConnection: {
            edges: { node: any }[];
            pageInfo: { hasNextPage: boolean; endCursor: string };
          };
        }>(
          `
          query Query($after: String) {
            crosscubesConnection(
              orderBy: publishedAt_DESC
              where: { data_json_path_exists: "$[*] ? (${createWhereForType(types)})" }
              first: 1000
              after: $after
            ) {
              edges {
                node {
                  id
                  title
                  authors {
                    name {
                      firstName
                      lastName
                    }
                  }
                  editors {
                    name {
                      firstName
                      lastName
                    }
                  }
                  data
                  svgSegments
                  slug
                  publishedAt
                  updatedAt
                  stage
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        `,
          { after },
        );

        const newCrosscubes = result?.crosscubesConnection.edges.map(
          (edge: any) => edge.node,
        );
        allCrosscubes = [...allCrosscubes, ...newCrosscubes];
        hasNextPage = result?.crosscubesConnection.pageInfo.hasNextPage;
        after = result?.crosscubesConnection.pageInfo.endCursor;
      }

      return allCrosscubes;
    };

    const crosscubes = await fetchAllCrosscubes();

    const puzzles: PuzzleType[] = crosscubes.map(
      (puzzle: any) =>
        ({
          id: puzzle.id,
          title: puzzle.title,
          authors: [
            puzzle.authors[0].name.firstName +
              (puzzle.authors[0].name.lastName != null
                ? ' ' + puzzle.authors[0].name.lastName
                : ''),
          ],
          date: puzzle.publishedAt ?? puzzle.updatedAt,
          previewState: 0,
          slug: puzzle.slug,
          data: puzzle.data,
          record: getCharacterRecord(puzzle.data),
        }) as PuzzleType,
    );

    return await enrichPuzzles(puzzles);
  } catch (error) {
    console.error('Error calling graphql!', JSON.stringify(error));
  }

  return [];
};

export const getPuzzleBySlug = async (
  slug: string,
): Promise<PuzzleType | null> => {
  try {
    const result = await queryReadOnly<{ crosscube: any }>(`
      query Query {
        crosscube(
          where: { slug: "${slug}" }
        ) {
          id
          title
          authors { name {
            firstName
            lastName
          } }
          editors { name {
            firstName
            lastName
          } }
          data
          svgSegments
          slug
          publishedAt
          updatedAt
          stage  
        }
      }
    `);

    const crosscube = result?.crosscube;

    if (crosscube == null) {
      return null;
    }

    const puzzle: PuzzleType = {
      id: crosscube.id,
      title: crosscube.title,
      authors: [
        crosscube.authors[0].name.firstName +
          ' ' +
          crosscube.authors[0].name.lastName,
      ],
      date: crosscube.publishedAt ?? crosscube.updatedAt,
      previewState: 0,
      slug: crosscube.slug,
      data: crosscube.data,
      svgSegments: crosscube.svgSegments,
      record: getCharacterRecord(crosscube.data),
    };

    await enrichPuzzles([puzzle]);

    return puzzle;
  } catch (error) {
    console.error('Error calling graphql!', error);
  }

  return null;
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
