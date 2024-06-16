'use client';

import { Link } from '@nextui-org/react';
import React from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

const ModalContainer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  width: 100svw;
  height: 100svh;
  background-color: var(--primary-bg);
`;

const ModalContent = styled.div``;

const ModalHeader = styled.div``;

interface OverlayProps {
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
  console.log(isOpen);
  return (
    isOpen === true &&
    createPortal(
      <ModalContainer>
        <ModalContent>
          <ModalHeader>
            <h2>{title}</h2>
            <Link onClick={onClose}>Done</Link>
          </ModalHeader>
          {children}
        </ModalContent>
      </ModalContainer>,
      document.body,
    )
  );
};

export default Overlay;
