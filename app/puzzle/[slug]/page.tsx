import { PuzzleType } from 'app/page';
import PuzzlePage from 'components/pages/PuzzlePage';
import { queryDato } from 'lib/dato';
import { getPuzzleBySlug } from 'lib/utils/reader';
import {
  AtlasType,
  NUMBER_RECORD,
  TEXTURE_RECORD,
  generateTextures,
} from 'lib/utils/textures';

export type PuzzleProps = {
  puzzle: PuzzleType & { svgsegments?: string[] };
  characterTextureAtlasLookup: AtlasType;
  cellNumberTextureAtlasLookup: AtlasType;
};

interface PuzzlePageProps extends PuzzleProps {
  slug: string;
}

export async function generateStaticParams() {
  const result = await queryDato({
    query: `
      {
        allPuzzles {
          slug
        }
      }
    `,
  });

  return (result != null && result.allPuzzles) ?? [];
}

async function getProps(slug: string): Promise<PuzzlePageProps> {
  // Only generate textures when needed
  if (process.env.GENERATE_TEXTURES === 'true') {
    await generateTextures();
  }

  const puzzle = await getPuzzleBySlug(slug);
  if (puzzle == null) throw new Error('Puzzle not found');
  const characterTextureAtlasLookup = TEXTURE_RECORD;
  const cellNumberTextureAtlasLookup = NUMBER_RECORD;

  if (puzzle.svgsegments != null) {
    // Ensure all svg segment unicode values are uppercase
    puzzle.svgsegments = puzzle.svgsegments.map((segment) =>
      segment.toUpperCase(),
    );
    // Validate that all svg segments are in the solution so the user can actually solve the puzzle
    puzzle.record.solution.forEach((item) => {
      if (item.value != '#' && item.value.value.length > 1) {
        if (
          puzzle.svgsegments?.includes(item.value.value.toUpperCase()) === false
        ) {
          throw new Error(
            `Missing segment "${item.value.value}" in puzzle solution!`,
          );
        }
      }
    });
    if (puzzle.svgsegments.length !== 26) {
      throw new Error('Puzzle must have 26 svg segments!');
    }
  }

  return {
    slug,
    puzzle: puzzle as PuzzleProps['puzzle'],
    characterTextureAtlasLookup,
    cellNumberTextureAtlasLookup,
  };
}

export default async function Page({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const props = await getProps(slug);
  return <PuzzlePage {...props} />;
}

export const dynamic = 'force-dynamic';
export const dynamicParams = false; // force 404
