'use client';

import * as React from 'react';
import 'components/svg/PreviewCube';
import 'components/svg/IconStar';
import { DifficultyEnum } from 'components/svg/IconStar';
import PreviewCube, { ProgressEnum } from 'components/svg/PreviewCube';
import { styled } from 'styled-components';
import {
  DifficultyLabel,
  getLabelForDifficulty,
} from 'components/composed/PuzzlePreview';
import DimensionIndicator from 'components/core/DimensionIndicator';

const Container = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  background-color: hsl(var(--secondary));
  border-radius: 0.25rem;
  border: 5px solid var(--grey800);
  user-select: none;
  min-height: 12rem;

  &:hover {
    transition: background-color 0.15s ease-in-out;
    background-color: hsl(var(--background));
  }

  @media (max-width: 400px) {
    span,
    p {
      font-size: 0.85rem;
    }
  }
`;

const CubeContainer = styled.section`
  margin: 0.75rem 0;
  display: flex;
  flex-direction: row;
  gap: 0.75rem;

  span {
    line-height: 1.2;
  }
`;

const TitleContainer = styled.header`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
  font-style: italic;
  margin-bottom: 0.25rem;
  span {
    font-size: 1rem;
  }
`;

const InfoContainer = styled.footer`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: baseline;
`;

const AiContainer = styled.div`
  background-color: hsl(var(--accent));
  border-radius: 0.25rem;
  padding: 0.05rem 0.25rem;
  margin-top: 0.33rem;
`;

const AboutContainer = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  left: 0.5rem;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.25rem;
`;

export interface PuzzleHighlightProps {
  title: string;
  author: string;
  date: string;
  isAiAssisted: boolean;
  difficulty: DifficultyEnum;
  previewState: ProgressEnum;
  colors?: [number, number, number];
  dimensions: [number, number];
}

const PuzzleHighlight: React.FC<PuzzleHighlightProps> = ({
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
      <AboutContainer>
        <DimensionIndicator dimensions={dimensions} />
        <DifficultyLabel
          className="semi text-xs italic"
          $difficulty={difficulty}
        >
          {getLabelForDifficulty(difficulty)}
        </DifficultyLabel>
      </AboutContainer>
      <CubeContainer>
        <PreviewCube
          width={90}
          height={80}
          progress={previewState}
          colors={colors}
        />
        <InfoContainer>
          <TitleContainer>
            <span>
              {previewState === ProgressEnum.Solved ? (
                <span>🎉&nbsp;&nbsp;</span>
              ) : (
                ''
              )}
              {title}
            </span>
          </TitleContainer>
          <span className="semi">{date}</span>
          <span className="capital">{author}</span>
          {isAiAssisted === true ? (
            <AiContainer className="dim text-sm italic">
              <span className="semi text-sm italic">ai</span>&nbsp;
              <span className="text-sm">assisted</span>
            </AiContainer>
          ) : null}
        </InfoContainer>
      </CubeContainer>
    </Container>
  );
};

export default PuzzleHighlight;
