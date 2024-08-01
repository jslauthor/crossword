'use client';

import Menu from 'components/containers/Menu';
import { Button } from 'components/core/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
`;

const Heading = styled.div`
  letter-spacing: -1.28px;
  font-weight: 600;
  font-style: italic;
  text-align: center;
`;

const Page: React.FC = () => {
  const router = useRouter();
  const onSignIn = useCallback(() => {
    router.push(`/signin?redirect_url=${window.location.href}`);
  }, [router]);

  return (
    <Menu onSignInPressed={onSignIn}>
      <div className="py-[48px] px-[32px] flex flex-col gap-[2rem] justify-center items-center">
        <Container className="gap-[1.5rem]">
          <Image
            alt="Crosscube Icon"
            src="/general_icon.png"
            width={156}
            height={156}
            className="rounded-[8px] aspect-square"
          />
          <div>
            <Heading className="text-[2rem]">crosscube</Heading>
            <span className="leading-6 italic text-sm">
              made with <span className="not-italic">❤️</span> for daily
              puzzlers
            </span>
          </div>
        </Container>
        <Link className="max-w-[220px] w-full" href="mailto:info@crosscube.com">
          <Button className="w-full" variant="inverted">
            Business & Partnerships ✉️
          </Button>
        </Link>
        <Heading className="text-[1.5rem]">credits & thanks</Heading>
        <div className="flex flex-col gap-2">
          <Heading className="text-[1rem]">games by</Heading>
          <div>
            <Link
              className="underline"
              href="https://leonardsouza.com"
              target="_blank"
            >
              Leonard Souza
            </Link>{' '}
            &{' '}
            <Link
              className="underline"
              href="https://jackbogdan.com"
              target="_blank"
            >
              Jack Bogdan
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-2 max-w-44 text-center">
          <Heading className="text-[1rem]">special thanks</Heading>
          our middle school english teachers
        </div>
      </div>
    </Menu>
  );
};

export default Page;
