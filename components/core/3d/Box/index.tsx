import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ThreeEvent, useFrame, useLoader } from '@react-three/fiber';
import {
  TextureLoader,
  RepeatWrapping,
  Vector3,
  Object3D,
  Color,
  Vector4,
} from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import { InstancedMesh, MeshPhysicalMaterial } from 'three';
import { PuzzleData } from '../../../../types/types';
import { rotateAroundPoint } from '../../../../lib/utils/three';
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
  attribute vec3 cellColor;

  varying vec2 vUv;
  varying vec2 vCharacterPosition;
  varying vec2 vCellNumberPosition;
  varying vec2 vCubeSideDisplay;
  varying vec3 vCellColor;

  void main()
  {
      vUv = uv;
      vCharacterPosition = characterPosition;
      vCellNumberPosition = cellNumberPosition;
      vCubeSideDisplay = cubeSideDisplay;
      vCellColor = cellColor;
  }
`;

const fragmentShader = `
  #ifdef GL_ES
  precision highp float;
  #endif

  uniform sampler2D numberTexture;
  uniform sampler2D characterTexture;
  uniform uint sideIndex;
  uniform float borderWidth;
  uniform vec4 borderColor;
  
  varying vec2 vUv;
  varying vec2 vCharacterPosition;
  varying vec2 vCellNumberPosition;
  varying vec2 vCubeSideDisplay;
  varying vec3 vCellColor;

  void main(void)
  {
    vec3 c = vCellColor.rgb;
    
    // Here we paint all of our textures

    // Show character when bitflag is on for the side
    if ((uint(vCubeSideDisplay.x) & sideIndex) == sideIndex) {
      // Draw the border
      float maxSize = 1.0 - borderWidth;
      float minSize = borderWidth;
      if (!(vUv.x < maxSize && vUv.x > minSize &&
        vUv.y < maxSize && vUv.y > minSize)) {
          c = borderColor.rgb * borderColor.a + c.rgb * (1.0 - borderColor.a);  // blending equation
      }

      // Draw the letter
      // A coord of -1, -1 means do not paint
      if (vCharacterPosition.x >= 0.0 && vCharacterPosition.y >= 0.0) {
        vec2 position = vec2(vCharacterPosition.x/6.0, -(vCharacterPosition.y/6.0 + 1.0/6.0));
        vec2 size = vec2(1.0 / 6.0, 1.0 / 6.0);
        vec2 coord = position + size * fract(vUv);
        vec4 Ca = texture2D(characterTexture, coord);
        c = Ca.rgb * Ca.a + c.rgb * (1.0 - Ca.a);  // blending equation
      }

      // Draw the cell number
      // A coord of -1, -1 means do not paint
      if (vCellNumberPosition.x >= 0.0 && vCellNumberPosition.y >= 0.0) {
        vec2 position = vec2(vCellNumberPosition.x/31.0, -(vCellNumberPosition.y/31.0 + 1.0/31.0));
        vec2 size = vec2(1.0 / 31.0, 1.0 / 31.0);
        vec2 coord = position + size * fract(vUv);
        vec4 Cb = texture2D(numberTexture, coord);
        c = Cb.rgb * Cb.a + c.rgb * (1.0 - Cb.a);  // blending equation
      }
    } else {
      c = vec3(0.02, 0.02, 0.02) * c.rgb;  // blending equation
    }
    
    csm_DiffuseColor = vec4(c, 1.0);
  }
`;

type LetterBoxesProps = {
  puzzleData: PuzzleData[];
  characterTextureAtlasLookup: Record<string, [number, number]>;
  cellNumberTextureAtlasLookup: Record<string, [number, number]>;
  setInstancedMesh: (instancedMesh: InstancedMesh | null) => void;
  selectedSide: number;
  onHovered?: (e: number | undefined) => void;
  onSelected?: (e: number | undefined) => void;
};
const tempObject = new Object3D();
const tempColor = new Color();
const DEFAULT_COLOR = 0x708d91;
const DEFAULT_SELECTED_COLOR = 0xd31996;
const DEFAULT_SELECTED_ADJACENT_COLOR = 0x19dd89;

export const LetterBoxes: React.FC<LetterBoxesProps> = ({
  puzzleData,
  characterTextureAtlasLookup,
  cellNumberTextureAtlasLookup,
  setInstancedMesh,
  selectedSide,
  onHovered,
  onSelected,
}) => {
  const [ref, setRef] = useState<InstancedMesh | null>(null);
  const [isVerticalOrientation, setVerticalOrientation] =
    useState<boolean>(true);
  const [prevOrientation, setPrevOrientation] = useState<boolean>(true);
  const [selected, setSelected] = useState<InstancedMesh['id']>();
  const [hovered, setHovered] = useState<InstancedMesh['id']>();
  const [prevHover, setPrevHovered] = useState<InstancedMesh['id']>();
  const [prevSelected, setPrevSelected] = useState<InstancedMesh['id']>();

  useEffect(() => {
    setInstancedMesh(ref);
  }, [ref, setInstancedMesh]);

  const [width, height, totalPerSide] = useMemo(() => {
    let { width, height } = puzzleData[0].dimensions;
    const totalPerSide = width * height;
    return [width, height, totalPerSide];
  }, [puzzleData]);

  const [record, size] = useMemo(() => {
    const record = getCharacterRecord(puzzleData);
    return [record, record.solution.length];
  }, [puzzleData]);

  const characterPositionArray = useMemo(
    () => Float32Array.from(new Array(size * 2).fill(-1)),
    [size]
  );

  const cellNumberPositionArray = useMemo(
    () => Float32Array.from(new Array(size * 2).fill(-1)),
    [size]
  );

  const cubeSideDisplayArray = useMemo(
    () => Float32Array.from(new Array(size * 2).fill(0)),
    [size]
  );

  const cellColorsArray = useMemo(
    () =>
      Float32Array.from(
        new Array(size * 3)
          .fill(0)
          .flatMap(() => tempColor.set(DEFAULT_COLOR).toArray())
      ),
    [size]
  );

  // Initial setup (orient the instanced boxes)
  useEffect(() => {
    if (ref == null) return;
    for (let j = 0; j < record.solution.length; j++) {
      const cell = record.solution[j];
      if (cell !== '#') {
        tempObject.rotation.set(0, 0, 0);
        tempObject.scale.set(1, 1, 1);
        const side = Math.ceil(j / totalPerSide) - 1;
        const x = (j % width) - 1;
        const y = Math.max(0, Math.ceil((j - side * totalPerSide) / width) - 1);

        cubeSideDisplayArray[j * 2] =
          CubeSidesEnum.six | (j % width === width - 1 ? CubeSidesEnum.two : 0);

        characterPositionArray[j * 2] =
          characterTextureAtlasLookup[cell.value][0];
        characterPositionArray[j * 2 + 1] =
          characterTextureAtlasLookup[cell.value][1];

        if (typeof cell.cell === 'number') {
          cellNumberPositionArray[j * 2] =
            cellNumberTextureAtlasLookup[cell.cell][0];
          cellNumberPositionArray[j * 2 + 1] =
            cellNumberTextureAtlasLookup[cell.cell][1];
        }

        if (side === 0) {
          tempObject.position.set(
            -x + height - 2,
            -y + height - 1,
            -height + 1
          );
        } else if (side === 1) {
          tempObject.position.set(-x + height - 2, -y + height - 1, 0);
          rotateAroundPoint(
            tempObject,
            new Vector3(0, 0, 0),
            new Vector3(0, 1, 0),
            Math.PI / 2,
            true
          );
        } else if (side === 2) {
          tempObject.position.set(-x - 1, -y + height - 1, 0);
          rotateAroundPoint(
            tempObject,
            new Vector3(0, 0, 0),
            new Vector3(0, 1, 0),
            Math.PI,
            true
          );
        } else if (side === 3) {
          tempObject.position.set(-x - 1, -y + height - 1, -height + 1);
          rotateAroundPoint(
            tempObject,
            new Vector3(0, 0, 0),
            new Vector3(0, 1, 0),
            -Math.PI / 2,
            true
          );
        }
      } else {
        // Hide the empty square
        tempObject.scale.set(0, 0, 0);
      }
      tempObject.updateMatrix();
      ref.setMatrixAt(j, tempObject.matrix);
    }
    ref.geometry.attributes.characterPosition.needsUpdate = true;
    ref.geometry.attributes.cellNumberPosition.needsUpdate = true;
    ref.geometry.attributes.cubeSideDisplay.needsUpdate = true;
    ref.instanceMatrix.needsUpdate = true;
  }, [
    ref,
    cellNumberPositionArray,
    cellNumberTextureAtlasLookup,
    characterPositionArray,
    characterTextureAtlasLookup,
    cubeSideDisplayArray,
    height,
    puzzleData,
    record.solution,
    totalPerSide,
    width,
  ]);

  useFrame((state) => {
    if (ref == null) return;
    for (let id = 0; id < record.solution.length; id++) {
      if (
        prevHover !== hovered ||
        prevSelected !== selected ||
        prevOrientation !== isVerticalOrientation
      ) {
        (id === hovered || id === selected
          ? tempColor.set(DEFAULT_SELECTED_COLOR)
          : tempColor.set(DEFAULT_COLOR)
        ).toArray(cellColorsArray, id * 3);

        // Store the prev so we can avoid this calculation next time
        setPrevHovered(hovered);
        setPrevSelected(selected);

        // Change the color of surrounding cells
        if (selected != null) {
          // We need to check if the selected cell is on the same side as the hovered cell in the case of the
          // first column (which is from the previous side)
          const sSide = Math.ceil(selected / totalPerSide) - 1;
          const isSameSide = sSide === selectedSide;
          const selectedCellX = selected % width;
          const selectedCellY = Math.max(
            0,
            Math.ceil((selected - sSide * totalPerSide) / width) - 1
          );

          if (
            isSameSide === false &&
            // we treat the last row of previous side as the first row of the current side
            selectedCellX !== width - 1
          ) {
            continue;
          }

          let interval = isVerticalOrientation ? height : 1;
          const startingId =
            isVerticalOrientation || isSameSide
              ? selected
              : selectedSide * totalPerSide + selectedCellY * height;

          for (
            let adjacentId = startingId + interval;
            adjacentId <= size;
            adjacentId += interval
          ) {
            const side = Math.ceil(adjacentId / totalPerSide) - 1;
            if (isVerticalOrientation && side !== sSide) continue;
            const cell = record.solution[adjacentId];
            if (cell === '#') {
              break;
            } else {
              tempColor
                .set(DEFAULT_SELECTED_ADJACENT_COLOR)
                .toArray(cellColorsArray, adjacentId * 3);
            }
          }

          for (
            let adjacentId = selected - interval;
            adjacentId > -interval;
            adjacentId -= interval
          ) {
            const x = adjacentId % width;

            // We need to check if we are on the first cell of a row
            // and if it is, we check the previous sides last row for a letter
            if (x === 0) {
              const int =
                selectedSide !== 0
                  ? adjacentId - (width * width - (width - 1))
                  : totalPerSide * puzzleData.length -
                    1 -
                    (width * width - width - 1) +
                    adjacentId -
                    1;
              const cell = record.solution[int];
              if (cell !== '#') {
                tempColor
                  .set(DEFAULT_SELECTED_ADJACENT_COLOR)
                  .toArray(cellColorsArray, int * 3);
              }
            }
            const side = Math.ceil(adjacentId / totalPerSide) - 1;
            if (isVerticalOrientation && side !== sSide) continue;
            const cell = record.solution[adjacentId];

            if (cell === '#') {
              break;
            } else {
              tempColor
                .set(DEFAULT_SELECTED_ADJACENT_COLOR)
                .toArray(cellColorsArray, adjacentId * 3);
            }
          }
        }

        setPrevOrientation(isVerticalOrientation);
        ref.geometry.attributes.cellColor.needsUpdate = true;
      }
    }
  });

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
          borderColor: { value: new Vector4(0, 0, 0, 1) },
          borderWidth: { value: 0.01 },
          numberTexture: { value: numberTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
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
          borderColor: { value: new Vector4(0, 0, 0, 1) },
          borderWidth: { value: 0.01 },
          numberTexture: { value: numberTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
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
          borderColor: { value: new Vector4(0, 0, 0, 1) },
          borderWidth: { value: 0.01 },
          numberTexture: { value: numberTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
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
          borderColor: { value: new Vector4(0, 0, 0, 1) },
          borderWidth: { value: 0.01 },
          numberTexture: { value: numberTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
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
          borderColor: { value: new Vector4(0, 0, 0, 1) },
          borderWidth: { value: 0.01 },
          numberTexture: { value: numberTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
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
          borderColor: { value: new Vector4(0, 0, 0, 1) },
          borderWidth: { value: 0.01 },
          numberTexture: { value: numberTextureAtlas },
          characterTexture: { value: characterTextureAtlas },
        },
      }),
    [characterTextureAtlas, numberTextureAtlas]
  );

  const onPointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(e.instanceId);
  }, []);

  const onPointerOut = useCallback(() => setHovered(undefined), []);

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (e.instanceId === selected) {
        setVerticalOrientation(!isVerticalOrientation);
      }

      e.stopPropagation();
      setSelected(e.instanceId);
    },
    [isVerticalOrientation, selected]
  );

  return (
    <instancedMesh
      ref={setRef}
      args={[undefined, undefined, size]}
      onPointerMove={onPointerMove}
      onPointerOut={onPointerOut}
      onPointerDown={onPointerDown}
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
        <instancedBufferAttribute
          attach="attributes-cellColor"
          count={cellColorsArray.length}
          itemSize={3}
          array={cellColorsArray}
        />
      </boxGeometry>
    </instancedMesh>
  );
};

export default LetterBoxes;
