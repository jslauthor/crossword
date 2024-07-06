import HomePage from 'components/pages/HomePage';
import { getPuzzles } from 'lib/utils/reader';
import { TEXTURE_RECORD } from 'lib/utils/textures';

export default async function Page() {
  return <HomePage puzzles={await getPuzzles()} atlas={TEXTURE_RECORD} />;
}
