'use client';

import styled from 'styled-components';
import Menu from 'components/containers/Menu';
import PuzzlePreview from 'components/composed/PuzzlePreview';
import { PuzzleType } from 'app/page';
import Link from 'next/link';
import { useState } from 'react';
import { AtlasType } from 'lib/utils/textures';
import PuzzleLatest from 'components/composed/PuzzleLatest';
import {
  getPuzzleLabel,
  getPuzzleStats,
  getTypeForSize,
} from 'lib/utils/puzzle';
import { HRule } from 'components/core/Dividers';

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--primary-app-width);
  padding: 0.75rem;
  background: hsl(var(--background));
`;

const PuzzlesContainer = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  align-items: stretch;
  margin-top: 1rem;
  width: 100%;
`;

const ErrorContainer = styled.div`
  padding: 1rem;
`;

export interface HomePageProps {
  puzzles: PuzzleType[];
  atlas: AtlasType;
}

const Page: React.FC<HomePageProps> = ({ puzzles }) => {
  const [otherPuzzles] = useState(puzzles.slice(1));

  if (puzzles.length === 0) {
    return (
      <Menu>
        <Container>
          <ErrorContainer>
            <h2>
              No puzzles found! Something must have gone terribly wrong with the
              server. Please{' '}
              <a href="mailto:info@crosscube.com">contact support</a>.
            </h2>
          </ErrorContainer>
        </Container>
      </Menu>
    );
  }

  return (
    <Menu>
      <Container>
        <div className="flex flex-col gap-3">
          <h1 className="text-base">Latest Puzzles</h1>
          <Link href={`/puzzle/${puzzles[0].slug}`}>
            <PuzzleLatest
              type="moji"
              puzzleLabel={getPuzzleLabel(puzzles[0])}
              puzzleStats={getPuzzleStats(puzzles[0])}
              title={puzzles[0].title}
              author={puzzles[0].author}
              date={puzzles[0].date}
            />
          </Link>
          <Link href={`/puzzle/${puzzles[0].slug}`}>
            <PuzzleLatest
              type="mini"
              puzzleLabel={getPuzzleLabel(puzzles[0])}
              puzzleStats={getPuzzleStats(puzzles[0])}
              title={puzzles[0].title}
              author={puzzles[0].author}
              date={puzzles[0].date}
            />
          </Link>
          <Link href={`/puzzle/${puzzles[0].slug}`}>
            <PuzzleLatest
              type="cube"
              puzzleLabel={getPuzzleLabel(puzzles[0])}
              puzzleStats={getPuzzleStats(puzzles[0])}
              title={puzzles[0].title}
              author={puzzles[0].author}
              date={puzzles[0].date}
            />
          </Link>
          <Link href={`/puzzle/${puzzles[0].slug}`}>
            <PuzzleLatest
              type="mega"
              puzzleLabel={getPuzzleLabel(puzzles[0])}
              puzzleStats={getPuzzleStats(puzzles[0])}
              title={puzzles[0].title}
              author={puzzles[0].author}
              date={puzzles[0].date}
            />
          </Link>
        </div>
        <h1 className="text-base mt-4">Archive</h1>
        <PuzzlesContainer>
          {otherPuzzles.map((puzzle, index) => {
            const { author, title, date, previewState, slug } = puzzle;
            return (
              <>
                <Link key={slug} href={`/puzzle/${slug}`}>
                  <PuzzlePreview
                    title={title}
                    author={author}
                    date={date}
                    previewState={previewState}
                    puzzleLabel={getPuzzleLabel(puzzle)}
                    type={getTypeForSize(puzzle)}
                  />
                </Link>
                {index !== otherPuzzles.length - 1 && <HRule />}
              </>
            );
          })}
        </PuzzlesContainer>
      </Container>
    </Menu>
  );
};

export default Page;
