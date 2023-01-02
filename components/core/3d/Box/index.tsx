import React, {
  MutableRefObject,
  Ref,
  useEffect,
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
} from 'three';
import { Color, Depth, LayerMaterial } from 'lamina';

interface BoxProps {
  position?: THREE.Vector3;
  letterCoordinates?: Vector2;
}

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
    // 0.1666 = letterWidth / totalWidth (here there are 6 letters per row/col)
    colorMap.repeat = new Vector2(0.1666, 0.1666);
    colorMap.center = new Vector2(0, 1);
    colorMap.offset = new Vector2(
      0.1666 * letterCoordinates.x,
      letterCoordinates.y
    );
  }, [colorMap, letterCoordinates.x, letterCoordinates.y]);

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
      <meshStandardMaterial color="#FFFFFF" />
      <meshStandardMaterial map={colorMap} />
    </mesh>
  );
};

export default Box;
