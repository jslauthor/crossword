import { PuzzleEditor } from 'components/pages/PuzzleEditor';
import { PuzzleEditorStoreProvider } from 'lib/providers/puzzle-editor-provider';
import { AtlasType, NUMBER_RECORD, TEXTURE_RECORD } from 'lib/utils/atlas';
import { getPuzzlesBySlugs } from 'lib/utils/reader';
import { notFound } from 'next/navigation';
import { PuzzleType } from 'types/types';
import emojis from 'lib/emojiUnicodeList.mjs';

export type PuzzleEditorProps = {
  puzzle: PuzzleType;
  characterTextureAtlasLookup: AtlasType;
  cellNumberTextureAtlasLookup: AtlasType;
};

interface PuzzleEditorPageProps extends PuzzleEditorProps {
  slug: string;
}
async function getProps(slug: string): Promise<PuzzleEditorPageProps> {
  const puzzles = await getPuzzlesBySlugs([slug], true);
  if (puzzles.length === 0 || puzzles == null) {
    notFound();
  }
  const puzzle = puzzles[0];
  const characterTextureAtlasLookup = TEXTURE_RECORD;
  const cellNumberTextureAtlasLookup = NUMBER_RECORD;

  if (puzzle.svgSegments != null) {
    const validEmojis = emojis.map((emoji) => emoji.toUpperCase());

    // Ensure all svg segments are unique
    const uniqueSet = new Set(puzzle.svgSegments);
    if (puzzle.svgSegments.length !== uniqueSet.size) {
      throw new Error('Puzzle must have unique svg segments!');
    }

    // Ensure all svg segment unicode values are uppercase
    puzzle.svgSegments = puzzle.svgSegments.map((segment) =>
      segment.toUpperCase(),
    );

    for (const unicodeString of puzzle.svgSegments) {
      try {
        // Check if the emoji is in the list of valid emojis
        if (!validEmojis.includes(unicodeString)) {
          throw new Error(`Puzzle has invalid emoji! ${unicodeString}`);
        }
      } catch (error) {
        throw new Error(`Found an error with the puzzle's SVGs! ${error}`);
      }
    }

    // Validate that all svg segments are in the solution so the user can actually solve the puzzle
    puzzle.record.solution.forEach((item) => {
      if (item.value != '#' && item.value.value.length > 1) {
        if (
          puzzle.svgSegments?.includes(item.value.value.toUpperCase()) === false
        ) {
          throw new Error(
            `Missing segment "${item.value.value}" in puzzle solution!`,
          );
        }
      }
    });

    if (puzzle.svgSegments.length !== 26) {
      throw new Error(
        `Puzzle must have 26 svg segments! Has ${puzzle.svgSegments.length}`,
      );
    }
  }

  return {
    slug,
    puzzle: puzzle as PuzzleEditorPageProps['puzzle'],
    characterTextureAtlasLookup,
    cellNumberTextureAtlasLookup,
  };
}

export default async function Page({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const props = await getProps(
    slug?.length > 0 ? slug[0] : 'vibrant-visions-of-life-s-journey',
  );

  return (
    <PuzzleEditorStoreProvider>
      <PuzzleEditor {...props} />
    </PuzzleEditorStoreProvider>
  );
}
