'use client';

import { Spinner } from 'components/core/ui/spinner';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

export default function Page() {
  return (
    <Container>
      <Spinner show />
    </Container>
  );
}
