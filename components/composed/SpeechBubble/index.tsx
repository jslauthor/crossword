import React, { ReactNode } from 'react';
import styled from 'styled-components';
import SpeechBubbleTail from 'components/svg/SpeechBubbleTail';

const Bubble = styled.div`
  position: relative;
  background-color: hsl(var(--blue500-hsl));
`;

const Tail = styled(SpeechBubbleTail)`
  position: absolute;
  bottom: 0;
  right: -0.34rem;
  color: hsl(var(--blue500-hsl));
`;

interface SpeechBubbleProps {
  children?: ReactNode;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({ children }) => {
  return (
    <Bubble className="text-base flex flex-col p-3 rounded-2xl">
      <p>{children}</p>
      <Tail />
    </Bubble>
  );
};

export default SpeechBubble;
