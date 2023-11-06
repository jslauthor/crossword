'use client';

import * as React from 'react';
import 'components/svg/PreviewCube';
import 'components/svg/IconStar';
import {
  DEFAULT_COLOR,
  DEFAULT_SELECTED_ADJACENT_COLOR,
  DEFAULT_SELECTED_COLOR,
} from 'components/pages/PuzzlePage';
import IconStar, { DifficultyEnum } from 'components/svg/IconStar';
import PreviewCube, { ProgressEnum } from 'components/svg/PreviewCube';
import { styled } from 'styled-components';
import { getColorHex } from 'lib/utils/color';

const Container = styled.div`
  min-width: 8.125rem;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  background-color: var(--terciary-bg);
  border-radius: 0.25rem;
  aspect-ratio: 1;

  @media (max-width: 400px) {
    min-width: 9.8rem;
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

  @media (max-width: 400px) {
    font-size: 0.75rem;
  }
`;

const InfoContainer = styled.footer`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;

  @media (max-width: 400px) {
    font-size: 0.75rem;
  }
`;

const AiContainer = styled.div`
  background-color: var(--ai-bg);
  border-radius: 0.25rem;
  padding: 0.05rem 0.25rem;
  margin-top: 0.25rem;
`;

interface PuzzlePreviewProps {
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
            <span className="semi text-sm italic">ai</span>&nbsp;assisted
          </AiContainer>
        ) : null}
      </InfoContainer>
    </Container>
  );
};

export default PuzzlePreview;
