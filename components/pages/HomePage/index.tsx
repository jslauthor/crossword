'use client';

import styled from 'styled-components';
import Menu from 'components/containers/Menu';
import PuzzlePreview from 'components/composed/PuzzlePreview';
import { PuzzleType } from 'app/page';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import PuzzleHighlight from 'components/composed/PuzzleHighlight';
import { PuzzleProps } from '../PuzzlePage';

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--primary-app-width);
  padding: 0.75rem;
  background: var(--primary-bg);
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
  atlas: PuzzleProps['characterTextureAtlasLookup'];
}

const Page: React.FC<HomePageProps> = ({ puzzles, atlas }) => {
  const [latestPuzzle, setLatestPuzzle] = useState(puzzles[0]);
  const [otherPuzzles, setOtherPuzzles] = useState(puzzles.slice(1));

  useEffect(() => {
    const updatePuzzles = async () => {
      const updatePuzzlePreview = async (puzzle: PuzzleType) => {
        // TODO: Grab the positions from partykit
        // const positions = await retrieveGameState(
        //   puzzle,
        //   getCharacterPositionStorageKey(puzzle.id),
        //   atlas,
        //   createFloat32Array(puzzle),
        // );
        // puzzle.previewState = getProgressFromSolution(
        //   puzzle,
        //   JSON.parse(JSON.stringify(positions)) as Record<string, number>,
        // );
      };

      await updatePuzzlePreview(latestPuzzle);
      setLatestPuzzle({ ...latestPuzzle });

      for (const puzzle of otherPuzzles) {
        await updatePuzzlePreview(puzzle);
      }
      setOtherPuzzles([...otherPuzzles]);
    };
    updatePuzzles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atlas]);

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
