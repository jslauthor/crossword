'use client';

import * as React from 'react';
import 'components/svg/PreviewCube';
import 'components/svg/IconStar';
import { DEFAULT_SELECTED_ADJACENT_COLOR } from 'components/pages/PuzzlePage';
import IconStar, { DifficultyEnum } from 'components/svg/IconStar';
import PreviewCube, { ProgressEnum } from 'components/svg/PreviewCube';
import { styled } from 'styled-components';
import { getColorHex } from 'lib/utils/color';

const Container = styled.div`
  min-width: 11rem;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  background-color: var(--terciary-bg);
  border-radius: 0.25rem;
  aspect-ratio: 1 / 1;
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
  }
`;

const CubeContainer = styled.section`
  margin: 0.25rem 0;
`;

const TitleContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
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

export interface PuzzlePreviewProps {
  title: string;
  author: string;
  date: string;
  isAiAssisted: boolean;
  difficulty: DifficultyEnum;
  previewState: ProgressEnum;
  colors?: [number, number, number];
}

const PuzzlePreview: React.FC<PuzzlePreviewProps> = ({
  title = '',
  author = '',
  date = '',
  isAiAssisted = true,
  difficulty = DifficultyEnum.Easy,
  previewState = ProgressEnum.ZeroPercent,
  colors = [0x829b9e, 0x1fbe68, 0xd1a227],
}) => {
  return (
    <Container>
      <TitleContainer>
        <IconStar
          difficulty={difficulty}
          color={
            previewState === ProgressEnum.Solved
              ? getColorHex(0xd1a227)
              : getColorHex(DEFAULT_SELECTED_ADJACENT_COLOR)
          }
        />
        <span>
          {previewState === ProgressEnum.Solved ? (
            <span>🎉&nbsp;&nbsp;</span>
          ) : (
            ''
          )}
          {title}
        </span>
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
