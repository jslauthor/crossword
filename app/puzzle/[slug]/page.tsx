import { PuzzleType } from 'app/page';
import PuzzlePage from 'components/pages/PuzzlePage';
import { queryDato } from 'lib/dato';
import { getPuzzleBySlug } from 'lib/utils/reader';
import {
  NUMBER_RECORD,
  TEXTURE_RECORD,
  generateTextures,
} from 'lib/utils/textures';

type PuzzleProps = {
  puzzle: PuzzleType;
  characterTextureAtlasLookup: Record<string, [number, number]>;
  cellNumberTextureAtlasLookup: Record<string, [number, number]>;
  slug: string;
};

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

async function getProps(slug: string): Promise<PuzzleProps> {
  // Only generate textures in development
  if (process.env.NODE_ENV === 'development') {
    await generateTextures();
  }

  const puzzle = await getPuzzleBySlug(slug);
  if (puzzle == null) throw new Error('Puzzle not found');
  const characterTextureAtlasLookup = TEXTURE_RECORD;
  const cellNumberTextureAtlasLookup = NUMBER_RECORD;
  return {
    slug,
    puzzle,
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
