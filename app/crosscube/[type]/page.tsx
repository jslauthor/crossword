import HomePage from 'components/pages/HomePage';
import { getPuzzles } from 'lib/utils/reader';
import { CrosscubeType, ValidCrosscubeArray } from 'types/types';

export async function generateStaticParams() {
  const types = ['cube', 'mega', 'mini', 'moji'] as ValidCrosscubeArray;
  return (types as Array<string>).map((type) => ({
    type,
  }));
}

export default async function Page({
  params: { type },
}: {
  params: { type: CrosscubeType };
}) {
  return <HomePage puzzles={await getPuzzles([type])} type={type} />;
}

// Regenerate every 5 minutes
export const revalidate = 600;
