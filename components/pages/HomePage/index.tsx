'use client';

import styled from 'styled-components';
import Menu from 'components/containers/Menu';
import PuzzlePreview from 'components/composed/PuzzlePreview';
import { PuzzleType } from 'app/page';
import Link from 'next/link';
import { useMemo } from 'react';
import PuzzleHighlight from 'components/composed/PuzzleHighlight';

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--primary-app-width);
  padding: 0.75rem;
`;

const PuzzlesContainer = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: stretch;
  margin-top: 1rem;
  width: 100%;
`;

export interface HomePageProps {
  puzzles: PuzzleType[];
}

const Page: React.FC<HomePageProps> = ({ puzzles }) => {
  const latestPuzzle = useMemo(() => puzzles[0], [puzzles]);
  const otherPuzzles = useMemo(() => puzzles.slice(1), [puzzles]);

  return (
    <Menu>
      <Container>
        <Link href={`/puzzle/${latestPuzzle.slug}`}>
          <PuzzleHighlight
            title={latestPuzzle.title}
            author={latestPuzzle.author}
            date={latestPuzzle.date}
            isAiAssisted={latestPuzzle.isAiAssisted}
            difficulty={latestPuzzle.difficulty}
            previewState={latestPuzzle.previewState}
            dimensions={[
              latestPuzzle.data[0].dimensions.width,
              latestPuzzle.data[0].dimensions.height,
            ]}
          />
        </Link>
        <PuzzlesContainer>
          {otherPuzzles.map(
            (
              {
                author,
                title,
                date,
                difficulty,
                isAiAssisted,
                previewState,
                slug,
                data,
              },
              index,
            ) => (
              <Link key={slug} href={`/puzzle/${slug}`}>
                <PuzzlePreview
                  title={title}
                  author={author}
                  date={date}
                  isAiAssisted={isAiAssisted}
                  difficulty={difficulty}
                  previewState={previewState}
                  dimensions={[
                    data[0].dimensions.width,
                    data[0].dimensions.height,
                  ]}
                />
              </Link>
            ),
          )}
        </PuzzlesContainer>
      </Container>
    </Menu>
  );
};

export default Page;
