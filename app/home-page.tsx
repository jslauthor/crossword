'use client';

import styled from 'styled-components';
import MenuWrapper from 'components/core/MenuWrapper';
import PuzzlePreview from 'components/composed/PuzzlePreview';
import { DifficultyEnum } from 'components/svg/IconStar';
import { ProgressEnum } from 'components/svg/PreviewCube';

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
