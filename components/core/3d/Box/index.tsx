import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import THREE, { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, RepeatWrapping, Vector3, Object3D, Color } from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import { MeshPhysicalMaterial } from 'three';
import { InstancedMesh } from 'three';
import { PuzzleData } from '../../../../types/types';
import { rotateAroundPoint } from '../../../../lib/utils/matrix';
import { getCharacterRecord } from '../../../../lib/utils/puzzle';
import { randomIntFromInterval } from '../../../../lib/utils/math';

const vertexShader = `
  attribute vec2 characterPosition;
  attribute float showOnSide123;
  attribute float showOnSide456;

  varying vec2 vUv;
  varying vec2 vCharacterPosition;
  varying float vShowOnSide123;
  varying float vShowOnSide456;

  void main()
  {
      vUv = uv;
      vCharacterPosition = characterPosition;
      vShowOnSide123 = showOnSide123;
      vShowOnSide456 = showOnSide456;
  }
`;

const fragmentShader = `
  #ifdef GL_ES
  precision highp float;
  #endif

  uniform sampler2D numberTexture;
  uniform sampler2D characterTexture;
  
  varying vec2 vUv;
  varying vec2 vCharacterPosition;
  varying float vShowOnSide123;
  varying float vShowOnSide456;

  void main(void)
  {
    vec2 position = vec2(vCharacterPosition.x/6.0, -(vCharacterPosition.y/6.0 + 1.0/6.0));
    vec2 size = vec2(1.0 / 6.0, 1.0 / 6.0);
    vec2 coord = position + size * fract(vUv);
    vec3 c = diffuse.rgb;

    if (vShowOnSide123 == float(0) && vShowOnSide456 == float(0)) {
      csm_DiffuseColor = vec4(c, 1.0);
    } else {
      vec4 Ca = texture2D(numberTexture, coord);
      c = Ca.rgb * Ca.a + c.rgb * (1.0 - Ca.a);  // blending equation
      // vec4 Cb = texture2D(characterTexture, coord);
      // c = Ca.rgb * Ca.a + Cb.rgb * Cb.a * (1.0 - Ca.a);  // blending equation
      csm_DiffuseColor = vec4(c, 1.0);
    }
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
        new Array(size).fill(0).flatMap((_, i) => randomIntFromInterval(1, 6))
      ),
    [size]
  );

  const showOnSide123Array = useMemo(
    () => Float32Array.from(new Array(size * 3).fill(1)),
    [size]
  );

  const showOnSide456Array = useMemo(
    () => Float32Array.from(new Array(size * 3).fill(1)),
    [size]
  );

  // Initial setup
  useEffect(() => {
    if (ref.current == null) return;
    let id = 0;
    const { width, height } = puzzleData[0].dimensions;
    for (let sides = 0; sides < puzzleData.length; sides++) {
      const { puzzle } = puzzleData[sides];
      for (let y = 0; y < puzzle.length; y++) {
        for (let x = 0; x < puzzle[y].length; x++) {
          // skip the first item in each row other than the first side
          const isRepeated =
            sides !== 0 && (x === 7 || (sides === 3 && x === 0));
          const isNumber = typeof puzzle[y][x] === 'number';
          if (!isRepeated && (isNumber || puzzle[y][x] === ':')) {
            tempObject.rotation.set(0, 0, 0);

            if (sides === 0) {
              tempObject.position.set(x, y, -width);
            } else if (sides === 1) {
              tempObject.position.set(x + 1, y, 0);
              rotateAroundPoint(
                tempObject,
                new Vector3(0, 0, 0),
                new Vector3(0, 1, 0),
                Math.PI / 2,
                true
              );
            } else if (sides === 2) {
              tempObject.position.set(x - width + 1, y, 1);
              rotateAroundPoint(
                tempObject,
                new Vector3(0, 0, 0),
                new Vector3(0, 1, 0),
                Math.PI,
                true
              );
            } else if (sides === 3) {
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

  // Material setup
  const side0 = useMemo(
    () =>
      new CustomShaderMaterial({
        baseMaterial: MeshPhysicalMaterial,
        vertexShader,
        fragmentShader,
        uniforms: {
          numberTexture: { value: characterTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
        color: '#cc0a95',
      }),
    [characterTextureAtlas]
  );
  const side1 = useMemo(
    () =>
      new CustomShaderMaterial({
        baseMaterial: MeshPhysicalMaterial,
        vertexShader,
        fragmentShader,
        uniforms: {
          numberTexture: { value: characterTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
        color: '#cc0a95',
      }),
    [characterTextureAtlas]
  );
  const side2 = useMemo(
    () =>
      new CustomShaderMaterial({
        baseMaterial: MeshPhysicalMaterial,
        vertexShader,
        fragmentShader,
        uniforms: {
          numberTexture: { value: characterTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
        color: '#cc0a95',
      }),
    [characterTextureAtlas]
  );
  const side3 = useMemo(
    () =>
      new CustomShaderMaterial({
        baseMaterial: MeshPhysicalMaterial,
        vertexShader,
        fragmentShader,
        uniforms: {
          numberTexture: { value: characterTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
        color: '#cc0a95',
      }),
    [characterTextureAtlas]
  );
  const side4 = useMemo(
    () =>
      new CustomShaderMaterial({
        baseMaterial: MeshPhysicalMaterial,
        vertexShader,
        fragmentShader,
        uniforms: {
          numberTexture: { value: characterTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
        color: '#cc0a95',
      }),
    [characterTextureAtlas]
  );
  const side5 = useMemo(
    () =>
      new CustomShaderMaterial({
        baseMaterial: MeshPhysicalMaterial,
        vertexShader,
        fragmentShader,
        uniforms: {
          numberTexture: { value: characterTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
        color: '#cc0a95',
      }),
    [characterTextureAtlas]
  );

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, size - 32]}
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
          attach="attributes-showOnSide123"
          count={showOnSide123Array.length}
          itemSize={3}
          array={showOnSide123Array}
        />
        <instancedBufferAttribute
          attach="attributes-showOnSide456"
          count={showOnSide456Array.length}
          itemSize={3}
          array={showOnSide456Array}
        />
      </boxGeometry>
    </instancedMesh>
  );
};

export default LetterBoxes;
