'use client';

import * as React from 'react';
import 'components/svg/PreviewCube';
import 'components/svg/IconStar';
import { DEFAULT_SELECTED_ADJACENT_COLOR } from 'components/pages/PuzzlePage';
import IconStar, { DifficultyEnum } from 'components/svg/IconStar';
import PreviewCube, { ProgressEnum } from 'components/svg/PreviewCube';
import { styled } from 'styled-components';
import { getColorHex } from 'lib/utils/color';
import DimensionIndicator from 'components/core/DimensionIndicator';

export const getLabelForDifficulty = (difficulty: DifficultyEnum) => {
  switch (difficulty) {
    case DifficultyEnum.Easy:
      return 'Easy';
    case DifficultyEnum.Medium:
      return 'Medium';
    case DifficultyEnum.Hard:
      return 'Hard';
    default:
      return 'Easy';
  }
};

export const getColorForProgress = (difficulty: DifficultyEnum) => {
  switch (difficulty) {
    case DifficultyEnum.Medium:
      return 'var(--medium-difficulty-text);';
    case DifficultyEnum.Hard:
      return 'var(--hard-difficulty-text);';
    default:
      return getColorHex(DEFAULT_SELECTED_ADJACENT_COLOR);
  }
};

const Container = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  background-color: var(--terciary-bg);
  border-radius: 0.25rem;
  min-height: 10rem;
  user-select: none;

  &:hover {
    transition: background-color 0.15s ease-in-out;
    background-color: var(--preview-hover-bg);
  }

  @media (max-width: 400px) {
    span,
    p {
      font-size: 0.85rem;
    }
    aspect-ratio: 1/1;
  }
`;

const CubeContainer = styled.section`
  margin: 0.25rem 0;
`;

const TitleContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  text-align: right;
  font-style: italic;
`;

const InfoContainer = styled.footer`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const AiContainer = styled.div`
  background-color: var(--ai-bg);
  border-radius: 0.25rem;
  padding: 0.05rem 0.25rem;
  margin-top: 0.25rem;
`;

export const DifficultyLabel = styled.span<{
  $difficulty: DifficultyEnum;
}>`
  color: ${({ $difficulty: difficulty }) => getColorForProgress(difficulty)};
`;

export interface PuzzlePreviewProps {
  title: string;
  author: string;
  date: string;
  isAiAssisted: boolean;
  difficulty: DifficultyEnum;
  previewState: ProgressEnum;
  colors?: [number, number, number];
  dimensions: [number, number];
}

const PuzzlePreview: React.FC<PuzzlePreviewProps> = ({
  title = '',
  author = '',
  date = '',
  isAiAssisted = true,
  difficulty = DifficultyEnum.Easy,
  previewState = ProgressEnum.ZeroPercent,
  colors = [0x829b9e, 0x1fbe68, 0xd1a227],
  dimensions,
}) => {
  return (
    <Container>
      <TitleContainer>
        <DimensionIndicator dimensions={dimensions} />
        <DifficultyLabel className="bold" $difficulty={difficulty}>
          {getLabelForDifficulty(difficulty)}
        </DifficultyLabel>
      </TitleContainer>
      <CubeContainer>
        <PreviewCube progress={previewState} colors={colors} />
      </CubeContainer>
      <InfoContainer>
        <span className="semi">{date}</span>
        <span className="capital">{author}</span>
        {isAiAssisted === true ? (
          <AiContainer className="dim text-sm italic">
            <span className="semi text-sm italic">ai</span>&nbsp;
            <span className="text-sm">assisted</span>
          </AiContainer>
        ) : null}
      </InfoContainer>
    </Container>
  );
};

export default PuzzlePreview;
