import HomePage from 'components/pages/HomePage';
import { getPuzzles } from 'lib/utils/reader';

export default async function Page() {
  return <HomePage puzzles={await getPuzzles()} />;
}

// Regenerate every 5 minutes
export const revalidate = 600;
