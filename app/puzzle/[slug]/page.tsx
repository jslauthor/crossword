import PuzzlePage from 'components/pages/PuzzlePage';
import { getPuzzleById, getPuzzles } from 'lib/utils/reader';
import {
  NUMBER_RECORD,
  TEXTURE_RECORD,
  generateTextures,
} from 'lib/utils/textures';
import { PuzzleData } from 'types/types';

type PuzzleProps = {
  puzzleData: PuzzleData[];
  characterTextureAtlasLookup: Record<string, [number, number]>;
  cellNumberTextureAtlasLookup: Record<string, [number, number]>;
  slug: string;
};

export async function generateStaticParams() {
  return (await getPuzzles()).map((fileName) => ({
    id: fileName,
    fallback: true,
  }));
}

async function getProps(slug: string | undefined = ''): Promise<PuzzleProps> {
  // Only generate textures in development
  if (process.env.NODE_ENV === 'development') {
    await generateTextures();
  }

  const puzzleData = await getPuzzleById(slug);
  const characterTextureAtlasLookup = TEXTURE_RECORD;
  const cellNumberTextureAtlasLookup = NUMBER_RECORD;
  return {
    slug: slug,
    puzzleData,
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
