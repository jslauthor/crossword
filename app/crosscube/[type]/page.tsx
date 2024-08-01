import HomePage from 'components/pages/HomePage';
import { getPuzzles } from 'lib/utils/reader';
import { CrosscubeType } from 'types/types';

export default async function Page({
  params: { type },
}: {
  params: { type: CrosscubeType };
}) {
  return <HomePage puzzles={await getPuzzles(false, [type])} type={type} />;
}
