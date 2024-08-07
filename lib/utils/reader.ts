import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { currentUser } from '@clerk/nextjs/server';
import { CrosscubeType, PuzzleType } from 'types/types';
import { getPuzzlesProgressForUser, getUserForClerkId } from 'lib/db';
import {
  updateAnswerIndex,
  getCharacterRecord,
  getProgressFromSolution,
  invertAtlas,
  initializeAnswerIndex,
  GAME_STATE_KEY,
  createInitialYDoc,
} from './puzzle';
import { TEXTURE_RECORD, buildSvgTextureAtlasLookup } from './atlas';
import * as Y from 'yjs';
import { queryReadOnly } from 'lib/hygraph';
import { setTimeout } from 'timers/promises';
import { User } from '@clerk/backend';
import { fromUint8Array } from 'js-base64';
import isGzip from 'is-gzip';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

const puzzleProperties = `
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
`;

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
  enrich: boolean,
  types: CrosscubeType[] = ['cube', 'mega', 'mini', 'moji'],
): Promise<PuzzleType[]> => {
  try {
    const fetchAllCrosscubes = async () => {
      let allCrosscubes: any = [];
      let hasNextPage = true;
      let after = null;

      while (hasNextPage) {
        await setTimeout(100);
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
                  ${puzzleProperties}
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

    if (enrich === true) {
      const clerkUser = await currentUser();
      return await enrichPuzzles(puzzles, clerkUser);
    }

    return puzzles;
  } catch (error) {
    console.error('Error calling graphql!', JSON.stringify(error));
  }

  return [];
};

export const getPuzzlesBySlugs = async (
  slugs: string[],
  enrich: boolean,
): Promise<PuzzleType[]> => {
  try {
    const fetchAllCrosscubes = async () => {
      let allCrosscubes: any[] = [];
      let hasNextPage = true;
      let after = null;
      const slugConditions = slugs
        .map((slug) => `{ slug: "${slug}" }`)
        .join(', ');

      while (hasNextPage) {
        await setTimeout(100);
        const result: any = await queryReadOnly<{
          crosscubesConnection: {
            edges: { node: any }[];
            pageInfo: { hasNextPage: boolean; endCursor: string };
          };
        }>(
          `
          query Query($after: String) {
            crosscubesConnection(
              where: { OR: [${slugConditions}] }
              first: 1000
              after: $after
            ) {
              edges {
                node {
                  ${puzzleProperties}
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

    const puzzles: PuzzleType[] = crosscubes
      .filter(
        (puzzleData): puzzleData is any =>
          puzzleData !== null && puzzleData !== undefined,
      )
      .map((puzzleData) => ({
        id: puzzleData.id,
        title: puzzleData.title,
        authors:
          puzzleData.authors
            ?.map(
              (author: { name: { firstName: string; lastName: string } }) =>
                author.name
                  ? `${author.name.firstName || ''} ${author.name.lastName || ''}`.trim()
                  : '',
            )
            .filter(Boolean) || [],
        date: puzzleData.publishedAt ?? puzzleData.updatedAt,
        previewState: 0,
        slug: puzzleData.slug,
        data: puzzleData.data,
        svgSegments: puzzleData.svgSegments,
        record: getCharacterRecord(puzzleData.data),
      }));

    if (enrich === true) {
      const clerkUser = await currentUser();
      return await enrichPuzzles(puzzles, clerkUser);
    }
    return puzzles;
  } catch (error) {
    console.error('Error calling graphql!', error);
    return [];
  }
};

const numberAtlas = invertAtlas(TEXTURE_RECORD);

// WARNING: This mutates the puzzles that are passed in
export const enrichPuzzles = async (
  puzzles: PuzzleType[],
  clerkUser: User | null,
) => {
  if (clerkUser != null) {
    const user = await getUserForClerkId(clerkUser.id);
    if (user != null) {
      // Grab all of the progresses for each of the puzzles for the user
      const progresses = await getPuzzlesProgressForUser(
        user.id,
        puzzles.map((p) => p.id),
      );

      // Add default YJS state to each puzzle
      for (const puzzle of puzzles) {
        const compressed = await gzipAsync(
          Y.encodeStateAsUpdateV2(createInitialYDoc(puzzle)),
        );
        puzzle.initialState = fromUint8Array(compressed);
      }

      // Update the previewState for each puzzle
      for (const progress of progresses) {
        const puzzle = puzzles.find((p) => p.id === progress.puzzleId);
        if (puzzle != null) {
          try {
            const doc = new Y.Doc();
            let state = Buffer.from(progress.state) as Uint8Array;

            // Check if the state is gzipped and decompress if necessary
            if (isGzip(state)) {
              state = await gunzipAsync(state);
            }

            Y.applyUpdateV2(doc, state);
            const positions = Float32Array.from(
              doc.getMap(GAME_STATE_KEY).get('characterPositions') as number[],
            );
            const index = updateAnswerIndex(
              initializeAnswerIndex(puzzle.record.solution),
              puzzle.svgSegments != null
                ? invertAtlas(buildSvgTextureAtlasLookup(puzzle.svgSegments))
                : numberAtlas,
              positions,
              puzzle.record.solution,
            );
            puzzle.initialState = fromUint8Array(await gzipAsync(state));
            puzzle.previewState = getProgressFromSolution(
              puzzle,
              positions,
              index,
            );
          } catch (e: any) {
            console.error(
              `Could not retrieve progress for puzzle ${puzzle.id} and user ${user.id}!`,
              e.message,
            );
          }
        }
      }
    }
  }

  return puzzles;
};
