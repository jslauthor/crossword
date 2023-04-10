import React, { useEffect } from 'react';
import { PresentationControls, useTexture } from '@react-three/drei';
import { RepeatWrapping } from 'three';
import { Canvas } from '@react-three/fiber';
import styled from '@emotion/styled';

const CanvasContainer = styled.div`
  width: 30px;
  height: 30px;
`;

interface BoxProps {
  defaultColor: number;
}

const Box: React.FC<BoxProps> = ({ defaultColor }) => {
  const [texture1, texture2, texture3, texture4] = useTexture([
    '/1.png',
    '/2.png',
    '/3.png',
    '/4.png',
  ]);

  useEffect(() => {
    texture1.wrapS = RepeatWrapping;
    texture1.wrapT = RepeatWrapping;
    texture2.wrapS = RepeatWrapping;
    texture2.wrapT = RepeatWrapping;
    texture3.wrapS = RepeatWrapping;
    texture3.wrapT = RepeatWrapping;
    texture4.wrapS = RepeatWrapping;
    texture4.wrapT = RepeatWrapping;
  }, [texture1, texture2, texture3, texture4]);

  return (
    <mesh scale={[5, 5, 5]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial
        attach="material-0"
        color={defaultColor}
        map={texture4}
      />
      <meshBasicMaterial
        attach="material-1"
        color={defaultColor}
        map={texture2}
      />
      <meshBasicMaterial attach="material-2" color={defaultColor} />
      <meshBasicMaterial attach="material-3" color={defaultColor} />
      <meshBasicMaterial
        attach="material-4"
        color={defaultColor}
        map={texture3}
      />
      <meshBasicMaterial
        attach="material-5"
        color={defaultColor}
        map={texture1}
      />
    </mesh>
  );
};

interface RotatingBoxProps {
  side: number;
  defaultColor: number;
}

const RotatingBox: React.FC<RotatingBoxProps> = ({ side, defaultColor }) => {
  return (
    <CanvasContainer>
      <Canvas>
        <PresentationControls
          global
          enabled={false}
          rotation={[0, Math.PI * (side / 2), 0]}
        >
          <Box defaultColor={defaultColor} />
        </PresentationControls>
      </Canvas>
    </CanvasContainer>
  );
};

export default RotatingBox;
