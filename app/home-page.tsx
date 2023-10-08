'use client';

import styled from '@emotion/styled';
import PuzzlePreview, {
  DifficultyEnum,
  ProgressEnum,
} from 'components/composed/PuzzlePreview';
import MenuWrapper from 'components/core/MenuWrapper';

const PreviewContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem;
  max-width: var(--primary-app-width);
`;

export default function Home() {
  return (
    <MenuWrapper>
      <PreviewContainer>
        <PuzzlePreview
          title="The Tempest"
          author="Leonard Souza"
          date="September 4, 2023"
          isAiAssisted={true}
          difficulty={DifficultyEnum.Easy}
          previewState={ProgressEnum.ZeroPercent}
        />
        <PuzzlePreview
          title="The Tempest"
          author="Leonard Souza"
          date="September 4, 2023"
          isAiAssisted={false}
          difficulty={DifficultyEnum.Medium}
          previewState={ProgressEnum.TwentyFivePercent}
        />
        <PuzzlePreview
          title="The Tempest"
          author="Leonard Souza"
          date="September 4, 2023"
          isAiAssisted={true}
          difficulty={DifficultyEnum.Hard}
          previewState={ProgressEnum.SeventyFivePercent}
        />
        <PuzzlePreview
          title="The Tempest"
          author="Leonard Souza"
          date="September 4, 2023"
          isAiAssisted={false}
          difficulty={DifficultyEnum.Medium}
          previewState={ProgressEnum.Solved}
        />
      </PreviewContainer>
    </MenuWrapper>
  );
}
