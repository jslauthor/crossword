'use client';

import styled from 'styled-components';
import Menu from 'components/containers/Menu';
import PuzzlePreview from 'components/composed/PuzzlePreview';
import { PuzzleType } from 'app/page';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AtlasType } from 'lib/utils/textures';
import PuzzleLatest from 'components/composed/PuzzleLatest';
import {
  CrosscubeType,
  getPuzzleLabel,
  getPuzzleStats,
  getTypeForSize,
} from 'lib/utils/puzzle';
import { HRule } from 'components/core/Dividers';
import { get } from 'http';

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

const crosscubeTypes = ['cube', 'mega', 'mini', 'moji'] as const;
type CheckAllUnions = {
  [K in CrosscubeType]: K extends (typeof crosscubeTypes)[number]
    ? true
    : false;
};
type AllUnionsPresent = CheckAllUnions[CrosscubeType] extends true
  ? true
  : false;
type ValidCrosscubeArray = AllUnionsPresent extends true
  ? typeof crosscubeTypes
  : never;

export interface HomePageProps {
  puzzles: PuzzleType[];
  atlas: AtlasType;
}

const Page: React.FC<HomePageProps> = ({ puzzles }) => {
  const { latestPuzzles, otherPuzzles } = useMemo(
    () =>
      puzzles.reduce(
        (acc, val) => {
          if (acc.types.has(getTypeForSize(val))) {
            acc.latestPuzzles.push(val);
            acc.types.delete(getTypeForSize(val));
          } else {
            acc.otherPuzzles.push(val);
          }
          return acc;
        },
        {
          latestPuzzles: [] as PuzzleType[],
          otherPuzzles: [] as PuzzleType[],
          types: new Set([
            'cube',
            'mega',
            'mini',
            'moji',
          ] as ValidCrosscubeArray),
        },
      ),
    [puzzles],
  );

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
          {latestPuzzles.map((puzzle, index) => (
            <Link key={puzzle.slug} href={`/puzzle/${puzzle.slug}`}>
              <PuzzleLatest
                type={getTypeForSize(puzzle)}
                puzzleLabel={getPuzzleLabel(puzzle)}
                puzzleStats={getPuzzleStats(puzzle)}
                title={puzzle.title}
                author={puzzle.author}
                date={puzzle.date}
              />
            </Link>
          ))}
        </div>
        <h1 className="text-base mt-4">Archive</h1>
        <PuzzlesContainer>
          {otherPuzzles.map((puzzle, index) => {
            const { author, title, date, previewState, slug } = puzzle;
            return (
              <div className="flex flex-col gap-4" key={slug}>
                <Link href={`/puzzle/${slug}`}>
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
              </div>
            );
          })}
        </PuzzlesContainer>
      </Container>
    </Menu>
  );
};

export default Page;
