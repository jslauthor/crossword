'use client';

import styled from 'styled-components';
import Menu from 'components/containers/Menu';
import PuzzlePreview from 'components/composed/PuzzlePreview';
import { CrosscubeType, PuzzleType, ValidCrosscubeArray } from 'types/types';
import Link from 'next/link';
import { useMemo } from 'react';
import PuzzleLatest from 'components/composed/PuzzleLatest';
import {
  getPuzzleLabel,
  getPuzzleLabelForType,
  getPuzzleStats,
  getTypeForSize,
} from 'lib/utils/puzzle';
import { HRule } from 'components/core/Dividers';
import { usePreviewState } from 'lib/utils/hooks/usePreviewState';
import { useUser } from '@clerk/nextjs';

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0.75rem;
  max-width: var(--primary-app-width);
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

const LatestTitle = styled.span<{ $type?: CrosscubeType }>`
  font-size: inherit;
  ${({ $type }) =>
    $type != null ? `color: hsl(var(--text-${$type}));` : null};
`;

const ErrorContainer = styled.div`
  padding: 1rem;
`;

const MegaPreview = () => (
  <PuzzleLatest
    type="mega"
    puzzleLabel={getPuzzleLabelForType('mega')}
    title="Not for the faint of heart."
    buttonLabel="Coming Soon"
    buttonDisabled
  />
);

export interface HomePageProps {
  puzzles: PuzzleType[];
  type?: CrosscubeType;
}

const Page: React.FC<HomePageProps> = ({ puzzles, type }) => {
  const { user } = useUser();
  const slugs = useMemo(() => puzzles.map((puzzle) => puzzle.slug), [puzzles]);
  const previewStates = usePreviewState(slugs, user?.id);
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

  const formattedLabel = useMemo(() => {
    if (type == null) return 'Puzzles';
    return getPuzzleLabelForType(type).map((label, index) => `${label} `);
  }, [type]);

  if (type == 'mega' && puzzles.length === 0) {
    return (
      <Menu>
        <Container>
          <MegaPreview />
        </Container>
      </Menu>
    );
  }

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
          <h1 className="text-base capitalize">
            Latest <LatestTitle $type={type}>{formattedLabel}</LatestTitle>
          </h1>
          {latestPuzzles.map((puzzle, index) => (
            <Link key={puzzle.slug} href={`/puzzle/${puzzle.slug}`}>
              <PuzzleLatest
                type={getTypeForSize(puzzle)}
                puzzleLabel={getPuzzleLabel(puzzle)}
                puzzleStats={getPuzzleStats(puzzle)}
                title={puzzle.title}
                authors={puzzle.authors}
                date={puzzle.date}
                previewState={
                  previewStates[puzzle.slug] == null
                    ? puzzle.previewState
                    : previewStates[puzzle.slug]
                }
              />
            </Link>
          ))}
        </div>
        {otherPuzzles.length > 0 && <h1 className="text-base mt-4">Archive</h1>}
        <PuzzlesContainer>
          {otherPuzzles.map((puzzle, index) => {
            const { authors, title, date, previewState, slug } = puzzle;
            return (
              <div className="flex flex-col gap-4" key={slug}>
                <Link href={`/puzzle/${slug}`}>
                  <PuzzlePreview
                    title={title}
                    authors={authors}
                    date={date}
                    previewState={
                      previewStates[slug] == null
                        ? previewState
                        : previewStates[slug]
                    }
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
