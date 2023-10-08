'use client';

import PuzzlePreview, {
  DifficultyEnum,
  ProgressEnum,
} from 'components/composed/PuzzlePreview';
import MenuWrapper from 'components/core/MenuWrapper';

export default function Home() {
  return (
    <MenuWrapper>
      <PuzzlePreview
        title="The Tempest"
        author="Leonard Souza"
        date="September 4, 2023"
        isAiAssisted
        difficulty={DifficultyEnum.Easy}
        previewState={ProgressEnum.ZeroPercent}
      />
      <PuzzlePreview
        title="The Tempest"
        author="Leonard Souza"
        date="September 4, 2023"
        isAiAssisted
        difficulty={DifficultyEnum.Medium}
        previewState={ProgressEnum.TwentyFivePercent}
      />
      <PuzzlePreview
        title="The Tempest"
        author="Leonard Souza"
        date="September 4, 2023"
        isAiAssisted
        difficulty={DifficultyEnum.Hard}
        previewState={ProgressEnum.SeventyFivePercent}
      />
      <PuzzlePreview
        title="The Tempest"
        author="Leonard Souza"
        date="September 4, 2023"
        isAiAssisted
        difficulty={DifficultyEnum.Medium}
        previewState={ProgressEnum.Solved}
      />
    </MenuWrapper>
  );
}
