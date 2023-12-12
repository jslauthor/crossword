import React, { useMemo } from 'react';
import styled from 'styled-components';

interface Props {
  dimensions: [number, number];
  className?: string;
}

const CellsContainer = styled.div<{ $dimensions: Props['dimensions'] }>`
  display: grid;
  grid-template-columns: repeat(${({ $dimensions }) => $dimensions[0]}, 0px);
  grid-template-rows: repeat(${({ $dimensions }) => $dimensions[1]}, 0px);
  grid-gap: 2px;
  width: ${({ $dimensions }) => $dimensions[0] * 2}px;
  height: ${({ $dimensions }) => $dimensions[1] * 2}px;
`;

const Cell = styled.div`
  width: 1px;
  height: 1px;
  background-color: var(--primary-cell-bg);
`;

const Container = styled.div`
  display: flex;
  gap: 0.05rem;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const CellLabel = styled.div`
  color: var(--primary-cell-bg);
  width: 100%;
  height: 100%;
  text-align: center;
`;

const DimensionIndicator: React.FC<Props> = ({ dimensions, className }) => {
  const cells = useMemo(() => {
    const [width, height] = dimensions;
    const cells = [];
    for (let i = 0; i < width * height; i++) {
      cells.push(<Cell key={i} />);
    }
    return cells;
  }, [dimensions]);

  return (
    <Container className={className}>
      <CellsContainer $dimensions={dimensions}>{cells}</CellsContainer>
      <CellLabel className="bold text-sm not-italic">
        {dimensions[0]}x{dimensions[1]}
      </CellLabel>
    </Container>
  );
};

export default DimensionIndicator;
