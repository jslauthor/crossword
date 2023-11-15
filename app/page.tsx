import { PuzzlePreviewProps } from 'components/composed/PuzzlePreview';
import HomePage from 'components/pages/HomePage';
import { formatDate } from 'lib/utils/date';
import { getPuzzles } from 'lib/utils/reader';

export default async function Page() {
  const puzzles: (PuzzlePreviewProps & { slug: string })[] = (
    await getPuzzles()
  ).map((puzzle) => ({
    title: puzzle.title,
    author: puzzle.author.fullName,
    date: formatDate(puzzle._firstPublishedAt),
    isAiAssisted: puzzle.isAiAssisted,
    difficulty: puzzle.difficulty,
    previewState: 1,
    slug: puzzle.slug,
  }));

  return <HomePage puzzles={puzzles} />;
}
