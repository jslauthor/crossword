'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';
import { styled } from 'styled-components';

export const dynamic = 'force-dynamic';

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

const Page: React.FC = () => {
  const path = usePathname();
  const params = useSearchParams();
  return (
    <Container>
      <SignUp redirectUrl={params.get('redirect_url') ?? '/'} path={path} />
    </Container>
  );
};

export default Page;
