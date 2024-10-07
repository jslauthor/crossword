'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import {
  PerspectiveCamera,
  PresentationControls,
  useTexture,
} from '@react-three/drei';
import { MeshBasicMaterial, RepeatWrapping, Texture, Vector4 } from 'three';
import { Canvas, extend } from '@react-three/fiber';
import styled from 'styled-components';
import { RoundedBoxGeometry } from 'components/three/RoundedBoxGeometry';
import { CubeSidesEnum } from 'components/core/3d/LetterBoxes/utils';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import { hexToVector } from 'lib/utils/color';
extend({ RoundedBoxGeometry });

const CanvasContainer = styled.div`
  width: 25px;
  height: 25px;
`;

interface BoxProps {
  color: number;
  textColor: number;
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
  }
`;

const fragmentShader = `
  #ifdef GL_ES
  precision highp float;
  #endif

  uniform sampler2D numberTexture;
  uniform uint sideIndex;
  uniform vec4 color;
  uniform vec4 textColor;
  
  varying vec2 vUv;

  vec4 applyColorChange(vec4 color, vec4 newColor) {
    return vec4(newColor.rgb, color.a); // Change white to the target color
  }

  void main(void)
  {
    vec3 c = color.rgb;
    vec4 Cb = texture2D(numberTexture, vUv);
    Cb = applyColorChange(Cb, textColor);
    c = Cb.rgb * Cb.a + c.rgb * (1.0 - Cb.a);  // blending equation
    csm_DiffuseColor = vec4(c, 1.0);
    csm_FragColor = vec4(c, 1.0);
  }
`;

type Uniforms = Record<string, { value: Texture | Vector4 | number }>;
const materialConfig = {
  baseMaterial: MeshBasicMaterial,
  toneMapped: false,
  fog: false,
  vertexShader,
  fragmentShader,
};
const materialMap: Map<CubeSidesEnum, CustomShaderMaterial> = new Map();
const createMaterial = (
  uniforms: Uniforms,
  texture: Texture,
  sideEnum: CubeSidesEnum,
) => {
  let material = materialMap.get(sideEnum);
  if (material != null) {
    Object.keys(uniforms).forEach((key) => {
      if (material != null) {
        if (material.uniforms[key]) {
          material.uniforms[key].value = uniforms[key].value;
        } else {
          material.uniforms[key] = uniforms[key];
        }
      }
    });
    material.uniforms.numberTexture = { value: texture };
    material.uniforms.sideIndex = { value: sideEnum };
    material.needsUpdate = true;
    return material;
  } else {
    material = new CustomShaderMaterial({
      ...materialConfig,
      uniforms: {
        numberTexture: { value: texture },
        sideIndex: { value: sideEnum },
        ...uniforms,
      },
    });
    materialMap.set(sideEnum, material);
    return material;
  }
};

const Box: React.FC<BoxProps> = ({ color, textColor }) => {
  const [texture1, texture2, texture3, texture4] = useTexture([
    '/1.webp',
    '/2.webp',
    '/3.webp',
    '/4.webp',
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

  const uniforms = useMemo(() => {
    return {
      color: { value: hexToVector(color) },
      textColor: { value: hexToVector(textColor) },
    };
  }, [color, textColor]);

  // Material setup
  const side0 = useMemo(
    () => createMaterial(uniforms, texture4, CubeSidesEnum.one),
    [texture4, uniforms],
  );
  const side1 = useMemo(
    () => createMaterial(uniforms, texture2, CubeSidesEnum.two),
    [texture2, uniforms],
  );
  const side2 = useMemo(
    () => createMaterial(uniforms, texture3, CubeSidesEnum.three),
    [texture3, uniforms],
  );
  const side3 = useMemo(
    () => createMaterial(uniforms, texture3, CubeSidesEnum.four),
    [texture3, uniforms],
  );
  const side4 = useMemo(
    () => createMaterial(uniforms, texture3, CubeSidesEnum.five),
    [texture3, uniforms],
  );
  const side5 = useMemo(
    () => createMaterial(uniforms, texture1, CubeSidesEnum.six),
    [texture1, uniforms],
  );

  return (
    <mesh material={[side0, side1, side2, side3, side4, side5]}>
      <roundedBoxGeometry args={[5.5, 5.5, 5.5, 4, 0.75]} />
    </mesh>
  );
};

export interface RotatingBoxProps extends BoxProps {
  side: number;
}

const RotatingBox: React.FC<RotatingBoxProps> = ({
  side,
  color,
  textColor,
}) => {
  return (
    <CanvasContainer>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={30} />
        <PresentationControls
          global
          enabled={false}
          rotation={[0, Math.PI + Math.PI * (side / 2), 0]}
        >
          <Box color={color} textColor={textColor} />
        </PresentationControls>
      </Canvas>
    </CanvasContainer>
  );
};

export default RotatingBox;
