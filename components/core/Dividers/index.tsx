import styled from 'styled-components';

export const HRule = styled.div<{ $heavy?: boolean }>`
  height: ${({ $heavy }) => ($heavy ? '2px' : '1px')};
  background: hsl(var(--foreground));
  opacity: ${({ $heavy }) => ($heavy ? 1.0 : 0.1)};
  width: 100%;
`;

export const VRule = styled.div`
  width: 2px;
  background: hsl(var(--foreground));
  opacity: 0.1;
  height: 80%;
`;
