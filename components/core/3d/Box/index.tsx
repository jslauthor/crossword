import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, RepeatWrapping, Vector3, Object3D, Color } from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import { MeshPhysicalMaterial } from 'three';
import { InstancedMesh } from 'three';
import { PuzzleData } from '../../../../types/types';
import { rotateAroundPoint } from '../../../../lib/utils/matrix';
import { getCharacterRecord } from '../../../../lib/utils/puzzle';
import { randomIntFromInterval } from '../../../../lib/utils/math';

enum CubeSidesEnum {
  one = 1 << 0,
  two = 1 << 1,
  three = 1 << 2,
  four = 1 << 3,
  five = 1 << 4,
  six = 1 << 5,
}

const vertexShader = `
  attribute vec2 characterPosition;
  attribute vec2 cellNumberPosition;
  attribute vec2 cubeSideDisplay;

  varying vec2 vUv;
  varying vec2 vCharacterPosition;
  varying vec2 vCellNumberPosition;
  varying vec2 vCubeSideDisplay;

  void main()
  {
      vUv = uv;
      vCharacterPosition = characterPosition;
      vCellNumberPosition = cellNumberPosition;
      vCubeSideDisplay = cubeSideDisplay;
  }
`;

const fragmentShader = `
  #ifdef GL_ES
  precision highp float;
  #endif

  uniform sampler2D numberTexture;
  uniform sampler2D characterTexture;
  uniform uint sideIndex;
  
  varying vec2 vUv;
  varying vec2 vCharacterPosition;
  varying vec2 vCellNumberPosition;
  varying vec2 vCubeSideDisplay;

  void main(void)
  {
    vec3 c = diffuse.rgb;
    
    // Show character when the side is flipped on
    if ((uint(vCubeSideDisplay.x) & sideIndex) == sideIndex) {
      vec2 position = vec2(vCharacterPosition.x/6.0, -(vCharacterPosition.y/6.0 + 1.0/6.0));
      vec2 size = vec2(1.0 / 6.0, 1.0 / 6.0);
      vec2 coord = position + size * fract(vUv);
      vec4 Ca = texture2D(characterTexture, coord);
      c = Ca.rgb * Ca.a + c.rgb * (1.0 - Ca.a);  // blending equation
    }
    
    vec2 position = vec2(vCellNumberPosition.x/31.0, -(vCellNumberPosition.y/31.0 + 1.0/31.0));
    vec2 size = vec2(1.0 / 31.0, 1.0 / 31.0);
    vec2 coord = position + size * fract(vUv);
    vec4 Cb = texture2D(numberTexture, coord);
    c = Cb.rgb * Cb.a + c.rgb * (1.0 - Cb.a);  // blending equation
    
    csm_DiffuseColor = vec4(c, 1.0);
  }
`;

type LetterBoxesProps = {
  puzzleData: PuzzleData[];
  onHovered?: (e: number | undefined) => void;
  onSelected?: (e: number | undefined) => void;
};
const tempObject = new Object3D();
const tempColor = new Color();

export const LetterBoxes: React.FC<LetterBoxesProps> = ({
  puzzleData,
  onHovered,
  onSelected,
}) => {
  const ref = useRef<InstancedMesh | null>(null);

  const [record, size] = useMemo(() => {
    const record = getCharacterRecord(puzzleData);
    return [record, record.filter((cell) => cell !== '#').length];
  }, [puzzleData]);

  const characterPositionArray = useMemo(
    () =>
      Float32Array.from(
        new Array(size * 2)
          .fill(0)
          .flatMap((_, i) => randomIntFromInterval(1, 6))
      ),
    [size]
  );

  const cellNumberPositionArray = useMemo(
    () =>
      Float32Array.from(
        new Array(size * 2)
          .fill(0)
          .flatMap((_, i) => randomIntFromInterval(1, 31))
      ),
    [size]
  );

  const cubeSideDisplayArray = useMemo(
    () => Float32Array.from(new Array(size * 2).fill(0)),
    [size]
  );

  // Initial setup (orient the instanced boxes)
  useEffect(() => {
    if (ref.current == null) return;
    let id = 0;
    const { width, height } = puzzleData[0].dimensions;
    for (let side = 0; side < puzzleData.length; side++) {
      const { puzzle } = puzzleData[side];
      for (let y = 0; y < puzzle.length; y++) {
        for (let x = 0; x < puzzle[y].length; x++) {
          // skip the first item in each row other than the first side
          const isRepeated = side !== 0 && (x === 7 || (side === 3 && x === 0));
          const isNumber = typeof puzzle[y][x] === 'number';
          if (!isRepeated && (isNumber || puzzle[y][x] === ':')) {
            tempObject.rotation.set(0, 0, 0);

            cubeSideDisplayArray[id * 2] =
              CubeSidesEnum.six | (x === 0 ? CubeSidesEnum.two : 0);

            if (side === 0) {
              tempObject.position.set(x, y, -width);
              if (x === 7) {
                cubeSideDisplayArray[id * 2] =
                  cubeSideDisplayArray[id * 2] | CubeSidesEnum.one;
              }
            } else if (side === 1) {
              tempObject.position.set(x + 1, y, 0);
              rotateAroundPoint(
                tempObject,
                new Vector3(0, 0, 0),
                new Vector3(0, 1, 0),
                Math.PI / 2,
                true
              );
            } else if (side === 2) {
              tempObject.position.set(x - width + 1, y, 1);
              rotateAroundPoint(
                tempObject,
                new Vector3(0, 0, 0),
                new Vector3(0, 1, 0),
                Math.PI,
                true
              );
            } else if (side === 3) {
              //
              tempObject.position.set(x - width, y, -width + 1);
              rotateAroundPoint(
                tempObject,
                new Vector3(0, 0, 0),
                new Vector3(0, 1, 0),
                -Math.PI / 2,
                true
              );
            }

            tempObject.updateMatrix();
            ref.current.setMatrixAt(id, tempObject.matrix);
            id = id + 1;
          }
        }
        ref.current.geometry.attributes.characterPosition.needsUpdate = true;
        ref.current.geometry.attributes.cellNumberPosition.needsUpdate = true;
        ref.current.geometry.attributes.cubeSideDisplay.needsUpdate = true;
        ref.current.instanceMatrix.needsUpdate = true;
      }
    }
  }, [puzzleData]);

  // useFrame((state) => {
  //   if (ref?.current == null) return;
  //   ref.current.geometry.attributes.characterPosition.needsUpdate = true;
  // });

  const characterTextureAtlas = useLoader(TextureLoader, '/texture_atlas.png');
  useEffect(() => {
    characterTextureAtlas.wrapS = RepeatWrapping;
    characterTextureAtlas.wrapT = RepeatWrapping;
  }, [characterTextureAtlas]);

  const numberTextureAtlas = useLoader(TextureLoader, '/number_atlas.png');
  useEffect(() => {
    numberTextureAtlas.wrapS = RepeatWrapping;
    numberTextureAtlas.wrapT = RepeatWrapping;
  }, [numberTextureAtlas]);

  // Material setup
  const side0 = useMemo(
    () =>
      new CustomShaderMaterial({
        baseMaterial: MeshPhysicalMaterial,
        vertexShader,
        fragmentShader,
        uniforms: {
          sideIndex: { value: CubeSidesEnum.one },
          numberTexture: { value: numberTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
        color: '#cc0a95',
      }),
    [characterTextureAtlas, numberTextureAtlas]
  );
  const side1 = useMemo(
    () =>
      new CustomShaderMaterial({
        baseMaterial: MeshPhysicalMaterial,
        vertexShader,
        fragmentShader,
        uniforms: {
          sideIndex: { value: CubeSidesEnum.two },
          numberTexture: { value: numberTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
        color: '#cc0a95',
      }),
    [characterTextureAtlas, numberTextureAtlas]
  );
  const side2 = useMemo(
    () =>
      new CustomShaderMaterial({
        baseMaterial: MeshPhysicalMaterial,
        vertexShader,
        fragmentShader,
        uniforms: {
          sideIndex: { value: CubeSidesEnum.three },
          numberTexture: { value: numberTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
        color: '#cc0a95',
      }),
    [characterTextureAtlas, numberTextureAtlas]
  );
  const side3 = useMemo(
    () =>
      new CustomShaderMaterial({
        baseMaterial: MeshPhysicalMaterial,
        vertexShader,
        fragmentShader,
        uniforms: {
          sideIndex: { value: CubeSidesEnum.four },
          numberTexture: { value: numberTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
        color: '#cc0a95',
      }),
    [characterTextureAtlas, numberTextureAtlas]
  );
  const side4 = useMemo(
    () =>
      new CustomShaderMaterial({
        baseMaterial: MeshPhysicalMaterial,
        vertexShader,
        fragmentShader,
        uniforms: {
          sideIndex: { value: CubeSidesEnum.five },
          numberTexture: { value: numberTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
        color: '#cc0a95',
      }),
    [characterTextureAtlas, numberTextureAtlas]
  );
  const side5 = useMemo(
    () =>
      new CustomShaderMaterial({
        baseMaterial: MeshPhysicalMaterial,
        vertexShader,
        fragmentShader,
        uniforms: {
          sideIndex: { value: CubeSidesEnum.six },
          numberTexture: { value: numberTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
        color: '#cc0a95',
      }),
    [characterTextureAtlas, numberTextureAtlas]
  );

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, size - 28]}
      // args={[undefined, undefined, 1]}
      onPointerMove={(e) => (
        e.stopPropagation(), onHovered && onHovered(e.instanceId)
      )}
      onPointerOut={() => onHovered && onHovered(undefined)}
      onPointerDown={(e) => onSelected && onSelected(e.instanceId)}
      material={[side0, side1, side2, side3, side4, side5]}
    >
      <boxGeometry args={[1, 1, 1]}>
        <instancedBufferAttribute
          attach="attributes-characterPosition"
          count={characterPositionArray.length}
          itemSize={2}
          array={characterPositionArray}
        />
        <instancedBufferAttribute
          attach="attributes-cellNumberPosition"
          count={cellNumberPositionArray.length}
          itemSize={2}
          array={cellNumberPositionArray}
        />
        <instancedBufferAttribute
          attach="attributes-cubeSideDisplay"
          count={cubeSideDisplayArray.length}
          itemSize={2}
          array={cubeSideDisplayArray}
        />
      </boxGeometry>
    </instancedMesh>
  );
};

export default LetterBoxes;
