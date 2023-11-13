'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import {
  PerspectiveCamera,
  PresentationControls,
  useTexture,
} from '@react-three/drei';
import { RepeatWrapping, Shader, ShaderChunk } from 'three';
import { Canvas } from '@react-three/fiber';
import styled from 'styled-components';

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

  const onShader = useCallback((shader: Shader) => {
    const custom_map_fragment = ShaderChunk.map_fragment.replace(
      `diffuseColor *= texture2D( map, vMapUv );`,
      `vec4 textSample = texture2D(map, vMapUv);
       diffuseColor = vec4( mix( diffuse, textSample.rgb, textSample.a ), opacity );`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      custom_map_fragment,
    );
  }, []);

  return (
    <mesh>
      <boxGeometry args={[5.5, 5.5, 5.5]} />
      <meshPhysicalMaterial
        attach="material-0"
        color={defaultColor}
        map={texture4}
        onBeforeCompile={onShader}
      />
      <meshPhysicalMaterial
        attach="material-1"
        color={defaultColor}
        map={texture2}
        onBeforeCompile={onShader}
      />
      <meshPhysicalMaterial attach="material-2" color={defaultColor} />
      <meshPhysicalMaterial attach="material-3" color={defaultColor} />
      <meshPhysicalMaterial
        attach="material-4"
        color={defaultColor}
        map={texture3}
        onBeforeCompile={onShader}
      />
      <meshPhysicalMaterial
        attach="material-5"
        color={defaultColor}
        map={texture1}
        onBeforeCompile={onShader}
      />
    </mesh>
  );
};

export interface RotatingBoxProps {
  side: number;
  defaultColor: number;
}

const RotatingBox: React.FC<RotatingBoxProps> = ({ side, defaultColor }) => {
  return (
    <CanvasContainer>
      <Canvas>
        <ambientLight intensity={3.5} />
        <pointLight
          position={[0, 0, 9]}
          intensity={5000}
          color={defaultColor}
        />
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={30} />
        <PresentationControls
          global
          enabled={false}
          rotation={[Math.PI * 0.09, Math.PI + Math.PI * (side / 2), 0]}
        >
          <Box defaultColor={defaultColor} />
        </PresentationControls>
      </Canvas>
    </CanvasContainer>
  );
};

export default RotatingBox;
