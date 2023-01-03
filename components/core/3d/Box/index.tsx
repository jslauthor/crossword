import React, {
  MutableRefObject,
  Ref,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import THREE, { useFrame, useLoader } from '@react-three/fiber';
import {
  BufferGeometry,
  Mesh,
  TextureLoader,
  Vector2,
  RepeatWrapping,
  Vector3,
  Vector4,
} from 'three';
import { Color, Depth, LayerMaterial } from 'lamina';

interface BoxProps {
  position?: THREE.Vector3;
  letterCoordinates?: Vector2;
}

const vertexShader = `
  varying vec2 vUv;

  void main()
  {
      vUv = uv;
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  #ifdef GL_ES
  precision highp float;
  #endif

  uniform vec2 characterPosition;
  uniform sampler2D numberTexture;
  uniform sampler2D characterTexture;

  varying vec2 vUv;

  void main(void)
  {
    vec2 position = vec2(characterPosition.x/6.0, -(characterPosition.y/6.0 + 1.0/6.0));
    vec2 size = vec2(1.0 / 6.0, 1.0 / 6.0);
    vec2 coord = position + size * fract(vUv);

    vec3 c;
    vec4 Ca = texture2D(numberTexture, coord);
    vec4 Cb = texture2D(characterTexture, coord);
    c = Ca.rgb * Ca.a + Cb.rgb * Cb.a * (1.0 - Ca.a);  // blending equation
    gl_FragColor= vec4(c, 1.0);
  }
`;

const Box: React.FC<BoxProps> = ({
  position = [1, 1, 1],
  letterCoordinates = new Vector2(0, 0),
}) => {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef<Mesh | null>(null);
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);

  const colorMap = useLoader(TextureLoader, '/texture_atlas.png');
  useEffect(() => {
    colorMap.wrapS = RepeatWrapping;
    colorMap.wrapT = RepeatWrapping;
  }, [colorMap, letterCoordinates.x, letterCoordinates.y]);

  const data = useMemo(
    () => ({
      uniforms: {
        color: { value: new Vector4(0, 1, 0, 1) },
        characterPosition: { value: new Vector2(0, 0) },
        numberTexture: { value: colorMap },
        characterTexture: { value: colorMap },
      },
      fragmentShader,
      vertexShader,
    }),
    [colorMap]
  );

  return (
    <mesh
      ref={ref}
      scale={1}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => hover(true)}
      onPointerOut={(event) => hover(false)}
      position={position}
    >
      <boxGeometry args={[1, 1, 1]} />
      <shaderMaterial {...data} />
    </mesh>
  );
};

export default Box;
