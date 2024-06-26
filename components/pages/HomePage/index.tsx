'use client';

import styled from 'styled-components';
import Menu from 'components/containers/Menu';
import PuzzlePreview from 'components/composed/PuzzlePreview';
import { PuzzleType } from 'app/page';
import Link from 'next/link';
import { useState } from 'react';
import PuzzleHighlight from 'components/composed/PuzzleHighlight';
import { AtlasType } from 'lib/utils/textures';

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
  grid-template-columns: 1fr 1fr;
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
        <Link href={`/puzzle/${puzzles[0].slug}`}>
          <PuzzleHighlight
            title={puzzles[0].title}
            author={puzzles[0].author}
            date={puzzles[0].date}
            isAiAssisted={puzzles[0].isAiAssisted}
            difficulty={puzzles[0].difficulty}
            previewState={puzzles[0].previewState}
            dimensions={[
              puzzles[0].data[0].dimensions.width,
              puzzles[0].data[0].dimensions.height,
            ]}
          />
        </Link>
        <PuzzlesContainer>
          {otherPuzzles.map(
            ({
              author,
              title,
              date,
              difficulty,
              isAiAssisted,
              previewState,
              slug,
              data,
            }) => (
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
