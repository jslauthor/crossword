'use client';

import PuzzlePreview, {
  DifficultyEnum,
  PreviewState,
} from 'components/composed/PuzzlePreview';
import MenuWrapper from 'components/core/MenuWrapper';

export default function Home() {
  return (
    <MenuWrapper>
      <PuzzlePreview
        title="The Tempest"
        author="Leonard Souza"
        date="September 4, 2023"
        isAiAssisted={true}
        difficulty={DifficultyEnum.Easy}
        previewState={PreviewState.InProgress}
      />
    </MenuWrapper>
  );
}
