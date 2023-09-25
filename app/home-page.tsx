'use client';

import styled from '@emotion/styled';
import Header from 'components/core/Header';
import { useCallback, useMemo, useState } from 'react';

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
`;

const ContentContainer = styled.div`
  position: relative;
  display: flex;
  padding: 0.75rem;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  max-width: var(--primary-app-width);
`;

const HeaderStyled = styled(Header)`
  width: 100%;
`;

// TODO: Convert this to a wrapper component for use here and in the puzzle page
// don't add it to the layout. Instead use a consistem component

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleMenuPressed = useCallback(() => {
    setIsMenuOpen(!isMenuOpen);
  }, [isMenuOpen]);

  return (
    <Container>
      <ContentContainer>
        <HeaderStyled
          onMenuPressed={handleMenuPressed}
          showCloseButton={isMenuOpen}
        />
      </ContentContainer>
    </Container>
  );
}
