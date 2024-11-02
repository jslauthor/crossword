'use client'; // Error components must be Client Components

import Menu from 'components/containers/Menu';
import { Button } from 'components/core/ui/button';
import { useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--primary-app-width);
  padding: 0.75rem;
  background: hsl(var(--background));
`;

const ErrorContainer = styled.div`
  padding: 1rem;
`;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <Menu>
      <Container>
        <ErrorContainer>
          <h2>
            Could not find the puzzle! If you have played this puzzle before
            then this is likely a server error. Please{' '}
            <a href="mailto:info@crosscube.com">contact support for help</a>.
          </h2>
          <br />
          <div>
            Or you can{' '}
            <Button
              size="sm"
              variant="outline"
              onClick={
                // Attempt to recover by trying to re-render the segment
                () => reset()
              }
            >
              refresh the page
            </Button>
          </div>
        </ErrorContainer>
      </Container>
    </Menu>
  );
}
