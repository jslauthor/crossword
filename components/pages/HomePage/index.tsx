'use client';

import styled from 'styled-components';
import Menu from 'components/containers/Menu';
import PuzzlePreview, {
  PuzzlePreviewProps,
} from 'components/composed/PuzzlePreview';

const PreviewContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  align-items: stretch;
  padding: 0.75rem;
  max-width: var(--primary-app-width);
`;

export interface HomePageProps {
  puzzles: (PuzzlePreviewProps & { slug: string })[];
}

const Page: React.FC<HomePageProps> = ({ puzzles }) => {
  return (
    <Menu>
      <PreviewContainer>
        {puzzles.map(
          ({
            author,
            title,
            date,
            difficulty,
            isAiAssisted,
            previewState,
            slug,
          }) => (
            <PuzzlePreview
              key={slug}
              title={title}
              author={author}
              date={date}
              isAiAssisted={isAiAssisted}
              difficulty={difficulty}
              previewState={previewState}
            />
          ),
        )}
      </PreviewContainer>
    </Menu>
  );
};

export default Page;
