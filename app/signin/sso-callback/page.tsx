'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import styled from 'styled-components';

const Container = styled.div`
  position: relative;
  padding-top: 1rem;
  width: 100vw;
  height: 100%;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
`;

const Page = () => {
  return (
    <Container>
      Redirecting...
      <AuthenticateWithRedirectCallback />
    </Container>
  );
};

export default Page;
