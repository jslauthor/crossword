import HomePage from 'components/pages/HomePage';
import { getPuzzles } from 'lib/utils/reader';

export default async function Page() {
  return <HomePage puzzles={await getPuzzles(false)} />;
}
