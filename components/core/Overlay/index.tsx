'use client';

import React, { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { HRule } from '../Dividers';

const ModalContainer = styled(motion.div)`
  position: fixed;
  inset: 0;
  width: 100svw;
  height: 100svh;
  background-color: hsl(var(--background));
  display: flex;
  justify-content: center;
`;

const ModalContent = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  max-width: var(--primary-app-width);
`;

const ScrollableContent = styled.div`
  overflow-y: auto;
  height: 100%;
  width: 100%;
`;

const ModalHeader = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  text-align: center;
  padding: 1rem;
`;

const H2 = styled.h2`
  grid-column: 2;
  font-weight: 500;
`;

const Text = styled.a`
  grid-column: 3;
  justify-self: end;
`;

export interface OverlayProps {
  title: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

const Overlay: React.FC<OverlayProps> = ({
  title,
  onClose,
  isOpen,
  children,
}) => {
  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <ModalContainer
          initial={{ top: '100%' }}
          animate={{ top: '0%' }}
          exit={{ top: '100%' }}
          transition={{
            ease: 'easeInOut',
            duration: 0.2,
          }}
        >
          <ModalContent>
            <ModalHeader>
              <H2>{title}</H2>
              <Text onClick={onClose} className="text-primary">
                Done
              </Text>
            </ModalHeader>
            <HRule />
            <ScrollableContent>{children}</ScrollableContent>
          </ModalContent>
        </ModalContainer>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default Overlay;
