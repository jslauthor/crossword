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
import { useKeyDown } from '../../../../lib/utils/hooks/useKeyDown';

const SUPPORTED_KEYBOARD_CHARACTERS: string[] = [];
for (let x = 0; x < 10; x++) {
  SUPPORTED_KEYBOARD_CHARACTERS.push(x.toString(10));
}
for (let x = 0; x <= 25; x++) {
  SUPPORTED_KEYBOARD_CHARACTERS.push(String.fromCharCode(65 + x));
}
for (let x = 0; x <= 1000; x++) {
  SUPPORTED_KEYBOARD_CHARACTERS.push(x.toString(10));
}
SUPPORTED_KEYBOARD_CHARACTERS.push('BACKSPACE');

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
  currentKey?: string | undefined;
  setInstancedMesh: (instancedMesh: InstancedMesh | null) => void;
  selectedSide: number;
  onHovered?: (e: number | undefined) => void;
  onSelected?: (e: number | undefined) => void;
  onLetterInput?: () => void;
  onSelectClue?: (clue: string | undefined) => void;
  defaultColor: number;
  selectedColor: number;
  adjacentColor: number;
};
const tempObject = new Object3D();
const tempColor = new Color();

export const LetterBoxes: React.FC<LetterBoxesProps> = ({
  puzzleData,
  characterTextureAtlasLookup,
  cellNumberTextureAtlasLookup,
  setInstancedMesh,
  selectedSide,
  currentKey,
  onHovered,
  onSelected,
  onLetterInput,
  onSelectClue,
  defaultColor,
  selectedColor,
  adjacentColor,
}) => {
  const [ref, setRef] = useState<InstancedMesh | null>(null);
  const [isVerticalOrientation, setVerticalOrientation] =
    useState<boolean>(true);
  const [prevOrientation, setPrevOrientation] = useState<boolean>(true);
  const [selected, setSelected] = useState<InstancedMesh['id']>();
  const [selectedWordCell, setSelectedWordCell] = useState<
    number | undefined
  >();
  const [hovered, setHovered] = useState<InstancedMesh['id']>();
  const [prevHover, setPrevHovered] = useState<InstancedMesh['id']>();
  const [prevSelected, setPrevSelected] = useState<InstancedMesh['id']>();
  const [prevSelectedSide, setPrevSelectedSide] =
    useState<LetterBoxesProps['selectedSide']>();
  const [lastCurrentKey, setLastCurrentKey] = useState<string | undefined>();

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

  useEffect(() => {
    if (onSelectClue != null) {
      if (!selected) onSelectClue(undefined);
      const { clues } = record;
      if (isVerticalOrientation === true) {
        onSelectClue(
          clues.down.find((c) => c.number === selectedWordCell)?.clue
        );
      } else {
        onSelectClue(
          clues.across.find((c) => c.number === selectedWordCell)?.clue
        );
      }
    }
  }, [isVerticalOrientation, onSelectClue, record, selected, selectedWordCell]);

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
          .flatMap(() => tempColor.set(defaultColor).toArray())
      ),
    [defaultColor, size]
  );

  const getInterval = useCallback(
    () => (isVerticalOrientation ? height : 1),
    [height, isVerticalOrientation]
  );

  // Deselect the selected cell when the selected side changes
  useEffect(() => {
    setSelected(undefined);
  }, [selectedSide]);

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
        prevOrientation !== isVerticalOrientation ||
        prevSelectedSide !== selectedSide
      ) {
        (id === hovered || id === selected
          ? tempColor.set(selectedColor)
          : tempColor.set(defaultColor)
        ).toArray(cellColorsArray, id * 3);

        // Store the prev so we can avoid this calculation next time
        setPrevHovered(hovered);
        setPrevSelected(selected);
        setPrevSelectedSide(selectedSide);
        setPrevOrientation(isVerticalOrientation);
        setSelectedWordCell(undefined);

        // Change the color of surrounding cells
        if (selected != null) {
          // We default to the selected cell for the first place in the word
          // and will override this if it is not the first place below
          const cell = record.solution[selected];
          if (cell !== '#' && typeof cell.cell === 'number') {
            setSelectedWordCell(cell.cell);
          }

          // We need to check if the selected cell is on the same side as the hovered cell in the case of the
          // first column (which is from the previous side)
          const sSide = Math.ceil(selected / totalPerSide) - 1;
          const isSameSide = sSide === selectedSide;
          const selectedCellX = selected % width;
          const selectedCellY = Math.max(
            0,
            Math.ceil((selected - sSide * totalPerSide) / width) - 1
          );

          let interval = getInterval();
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
                .set(adjacentColor)
                .toArray(cellColorsArray, adjacentId * 3);
            }
          }

          if (isVerticalOrientation === false && isSameSide === false) {
            ref.geometry.attributes.cellColor.needsUpdate = true;
            continue;
          }

          for (
            let adjacentId = selected - interval;
            adjacentId > -interval;
            adjacentId -= interval
          ) {
            const x = adjacentId % width;

            // We need to check if we are on the first cell of a row
            // and if it is, we check the previous side's last row for a letter
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
                if (typeof cell.cell === 'number') {
                  setSelectedWordCell(cell.cell);
                }
                tempColor.set(adjacentColor).toArray(cellColorsArray, int * 3);
              }
            }
            const side = Math.ceil(adjacentId / totalPerSide) - 1;
            if (isVerticalOrientation && side !== sSide) continue;
            const cell = record.solution[adjacentId];

            if (cell === '#') {
              break;
            } else {
              if (typeof cell.cell === 'number') {
                setSelectedWordCell(cell.cell);
              }
              tempColor
                .set(adjacentColor)
                .toArray(cellColorsArray, adjacentId * 3);
            }
          }
        }

        ref.geometry.attributes.cellColor.needsUpdate = true;
      }
    }
  });

  const onLetterChange = useCallback(
    (key: string) => {
      const coord = characterTextureAtlasLookup[key.toUpperCase()];
      if (selected != null && ref != null) {
        const x = key === '' || key === 'BACKSPACE' ? -1 : coord[0];
        const y = key === '' || key === 'BACKSPACE' ? -1 : coord[1];
        setLastCurrentKey(key);

        if (x !== -1) {
          // select the next cell
          const nextCell = selected + getInterval();
          const sSide = Math.ceil(selected / totalPerSide) - 1;
          const side = Math.ceil(nextCell / totalPerSide) - 1;
          const selectedX = nextCell % width;
          const selectedY = Math.max(
            0,
            Math.ceil((selected - sSide * totalPerSide) / width) - 1
          );
          if (selectedX === 0 && selectedSide !== sSide) {
            const int =
              selectedSide !== 0
                ? nextCell + (width * width - (width - 1))
                : selectedY * height + 1;
            const cell = record.solution[int];
            if (cell !== '#') {
              setSelected(int);
            }
          } else if (selectedX !== 0) {
            const cell = record.solution[nextCell];
            if (!((isVerticalOrientation && side !== sSide) || cell === '#')) {
              setSelected(nextCell);
            }
          }
        } else if (
          // select the prev cell
          characterPositionArray[selected * 2] === -1 ||
          lastCurrentKey === '' ||
          lastCurrentKey === 'BACKSPACE'
        ) {
          // select the previous cell
          const nextCell = selected - getInterval();
          const selectedX = nextCell % width;
          const sSide = Math.ceil(selected / totalPerSide) - 1;

          // We need to check if we are on the first cell of a row
          // and if it is, we check the previous sides last row for a letter
          if (selectedX === 0) {
            const int =
              selectedSide !== 0
                ? nextCell - (width * width - (width - 1))
                : totalPerSide * puzzleData.length -
                  1 -
                  (width * width - width - 1) +
                  nextCell -
                  1;
            const cell = record.solution[int];
            if (cell !== '#') {
              setSelected(int);
            }
          } else {
            const side = Math.ceil(nextCell / totalPerSide) - 1;
            const cell = record.solution[nextCell];

            if (
              !(
                (isVerticalOrientation && side !== sSide) ||
                cell === '#' ||
                // the -2 would normally be -1, but we skip a column, so we need to
                // subtract that one as well
                (selectedX === width - 2 && selectedSide !== sSide)
              )
            ) {
              setSelected(nextCell);
            }
          }
        }

        characterPositionArray[selected * 2] = x;
        characterPositionArray[selected * 2 + 1] = y;

        ref.geometry.attributes.characterPosition.needsUpdate = true;

        if (onLetterInput) {
          onLetterInput();
        }
      }
    },
    [
      characterPositionArray,
      characterTextureAtlasLookup,
      getInterval,
      height,
      isVerticalOrientation,
      lastCurrentKey,
      onLetterInput,
      puzzleData.length,
      record.solution,
      ref,
      selected,
      selectedSide,
      totalPerSide,
      width,
    ]
  );

  /**
   * Handle incoming letter input
   */
  useEffect(() => {
    if (currentKey != null) {
      onLetterChange(currentKey);
    }
    // Adding onLetterChange here causes multiple letter renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey]);

  useKeyDown(onLetterChange, SUPPORTED_KEYBOARD_CHARACTERS);

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
