'use client';

import { Link } from '@nextui-org/react';
import React from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { HRule } from '../Dividers';

const ModalContainer = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 9999;
  width: 100svw;
  height: 100svh;
  background-color: var(--primary-bg);
  display: flex;
  justify-content: center;
`;

const ModalContent = styled.div`
  width: 100%;
  height: 100%;
  max-width: var(--primary-app-width);
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

const Text = styled(Link)`
  grid-column: 3;
  justify-self: end;
`;

export interface OverlayProps {
  title: string;
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
              <Text onClick={onClose}>Done</Text>
            </ModalHeader>
            <HRule />
            {children}
          </ModalContent>
        </ModalContainer>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default Overlay;
