import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ThreeEvent, useFrame, useLoader } from '@react-three/fiber';
import {
  TextureLoader,
  RepeatWrapping,
  Vector3,
  Object3D,
  Color,
  Vector4,
  Euler,
} from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import { InstancedMesh, MeshPhysicalMaterial } from 'three';
import { rotateAroundPoint } from '../../../../lib/utils/three';
import {
  getCharacterRecord,
  isPuzzleSolved,
} from '../../../../lib/utils/puzzle';
import { useScaleRippleAnimation } from '../../../../lib/utils/hooks/animations/useScaleRippleAnimation';
import { rangeOperation } from '../../../../lib/utils/math';
import { usePuzzleProgress } from 'lib/utils/hooks/usePuzzleProgress';
import { PuzzleType } from 'app/page';

export enum CubeSidesEnum {
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
  attribute vec3 cellColor;
  in ivec2 cubeSideDisplay;
  
  varying vec2 vUv;
  varying vec2 vCharacterPosition;
  varying vec2 vCellNumberPosition;
  varying vec3 vCellColor;
  flat out ivec2 vCubeSideDisplay;

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
  varying vec3 vCellColor;
  flat varying ivec2 vCubeSideDisplay;

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
      c = vec3(0.07, 0.07, 0.07) * c.rgb;  // blending equation
    }
    
    csm_DiffuseColor = vec4(c, 1.0);
  }
`;

type LetterBoxesProps = {
  puzzle: PuzzleType;
  characterTextureAtlasLookup: Record<string, [number, number]>;
  cellNumberTextureAtlasLookup: Record<string, [number, number]>;
  currentKey?: string | undefined;
  selectedSide: number;
  defaultColor: number;
  selectedColor: number;
  adjacentColor: number;
  keyAndIndexOverride?: [string, number]; // For testing
  isVerticalOrientation: boolean;
  onVerticalOrientationChange: (isVerticalOrientation: boolean) => void;
  setInstancedMesh?: (instancedMesh: InstancedMesh | null) => void;
  onLetterInput?: () => void;
  onSelectClue?: (clue: string | undefined) => void;
  onInitialize?: () => void;
  onSolved?: () => void;
};
const tempObject = new Object3D();
const tempColor = new Color();

export const LetterBoxes: React.FC<LetterBoxesProps> = ({
  puzzle,
  characterTextureAtlasLookup,
  cellNumberTextureAtlasLookup,
  isVerticalOrientation = false,
  onVerticalOrientationChange,
  setInstancedMesh,
  selectedSide,
  keyAndIndexOverride,
  currentKey,
  onLetterInput,
  onSelectClue,
  defaultColor,
  selectedColor,
  adjacentColor,
  onInitialize,
  onSolved,
}) => {
  const [ref, setRef] = useState<InstancedMesh | null>(null);
  // const [isVerticalOrientation, setVerticalOrientation] =
  //   useState<boolean>(false);
  const [prevOrientation, setPrevOrientation] = useState<boolean>(
    isVerticalOrientation,
  );
  const [selected, setSelected] = useState<InstancedMesh['id'] | undefined>(0);
  const [selectedWordCell, setSelectedWordCell] = useState<
    number | undefined
  >();
  const [hovered, setHovered] = useState<InstancedMesh['id']>();
  const [prevHover, setPrevHovered] = useState<InstancedMesh['id']>();
  const [prevSelected, setPrevSelected] = useState<InstancedMesh['id']>();
  const [prevSelectedSide, setPrevSelectedSide] =
    useState<LetterBoxesProps['selectedSide']>();
  const [lastCurrentKey, setLastCurrentKey] = useState<string | undefined>();
  // const [initialRotations, setInitialRotations] = useState<Euler[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    if (setInstancedMesh) {
      setInstancedMesh(ref);
    }
  }, [ref, setInstancedMesh]);

  const [width, height, totalPerSide] = useMemo(() => {
    let { width, height } = puzzle.data[0].dimensions;
    const totalPerSide = width * height;
    return [width, height, totalPerSide];
  }, [puzzle.data]);

  const [record, size] = useMemo(() => {
    const record = getCharacterRecord(puzzle.data);
    return [record, record.solution.length];
  }, [puzzle.data]);

  const {
    addAnswerIndex,
    addCharacterPosition,
    answerIndex,
    characterPositionArray,
    hasRetrievedGameState,
  } = usePuzzleProgress(puzzle, record, isInitialized === true && ref != null);

  useEffect(() => {
    if (isPuzzleSolved(answerIndex) && onSolved != null) {
      onSolved();
    }
  }, [answerIndex, onSolved]);

  useEffect(() => {
    if (onSelectClue != null) {
      if (!selected) onSelectClue(undefined);
      const { clues } = record;
      if (isVerticalOrientation === true) {
        onSelectClue(
          clues.down.find((c) => c.number === selectedWordCell)?.clue,
        );
      } else {
        onSelectClue(
          clues.across.find((c) => c.number === selectedWordCell)?.clue,
        );
      }
    }
  }, [isVerticalOrientation, onSelectClue, record, selected, selectedWordCell]);

  const cellNumberPositionArray = useMemo(
    () => Float32Array.from(new Array(size * 2).fill(-1)),
    [size],
  );

  const cubeSideDisplayArray = useMemo(
    () => Int32Array.from(new Array(size * 2).fill(0)),
    [size],
  );

  const cellColorsArray = useMemo(
    () =>
      Float32Array.from(
        new Array(size * 3)
          .fill(0)
          .flatMap(() => tempColor.set(defaultColor).toArray()),
      ),
    [defaultColor, size],
  );

  const getInterval = useCallback(
    () => (isVerticalOrientation ? height : 1),
    [height, isVerticalOrientation],
  );

  const isVisibleSide = useCallback(
    (selected?: number) => {
      if (selected == null) {
        return false;
      }
      const xPos = selected % width;
      const previousSide = rangeOperation(0, 3, selectedSide, -1);
      const cellSide = Math.ceil(selected / totalPerSide) - 1;

      return (
        cellSide === selectedSide ||
        (xPos === width - 1 && cellSide === previousSide)
      );
    },
    [selectedSide, totalPerSide, width],
  );

  // const showIntroAnimation = useIntroAnimation(
  //   selectedSide,
  //   width,
  //   height,
  //   totalPerSide,
  //   size,
  //   initialRotations,
  //   cubeSideDisplayArray,
  //   record,
  //   ref
  // );

  const showRippleAnimation = useScaleRippleAnimation(
    width,
    height,
    totalPerSide,
    size,
    ref,
  );

  // Initial setup (orient the instanced boxes)
  useEffect(
    () => {
      if (ref == null) return;

      const rotations: Euler[] = [];
      for (let j = 0; j < record.solution.length; j++) {
        const cell = record.solution[j];
        if (cell !== '#') {
          tempObject.rotation.set(0, 0, 0);
          tempObject.scale.set(1, 1, 1);
          const side = Math.ceil(j / totalPerSide) - 1;
          const x = (j % width) - 1;
          const y = Math.max(
            0,
            Math.ceil((j - side * totalPerSide) / width) - 1,
          );

          // Sides three and four are the top and bottom (respectively)
          // 1, 2, 5, 6 are the camera facing sides

          cubeSideDisplayArray[j * 2] =
            CubeSidesEnum.six |
            (j % width === width - 1 ? CubeSidesEnum.two : 0);

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
              -height + 1,
            );
          } else if (side === 1) {
            tempObject.position.set(-x + height - 2, -y + height - 1, 0);
            rotateAroundPoint(
              tempObject,
              new Vector3(0, 0, 0),
              new Vector3(0, 1, 0),
              Math.PI / 2,
              true,
            );
          } else if (side === 2) {
            tempObject.position.set(-x - 1, -y + height - 1, 0);
            rotateAroundPoint(
              tempObject,
              new Vector3(0, 0, 0),
              new Vector3(0, 1, 0),
              Math.PI,
              true,
            );
          } else if (side === 3) {
            tempObject.position.set(-x - 1, -y + height - 1, -height + 1);
            rotateAroundPoint(
              tempObject,
              new Vector3(0, 0, 0),
              new Vector3(0, 1, 0),
              -Math.PI / 2,
              true,
            );
          }
        } else {
          // Hide the empty square
          tempObject.scale.set(0, 0, 0);
        }
        tempObject.updateMatrix();
        ref.setMatrixAt(j, tempObject.matrix);
        rotations[j] = new Euler().copy(tempObject.rotation);
      }
      ref.geometry.attributes.characterPosition.needsUpdate = true;
      ref.geometry.attributes.cellNumberPosition.needsUpdate = true;
      ref.geometry.attributes.cubeSideDisplay.needsUpdate = true;
      ref.instanceMatrix.needsUpdate = true;
      // select first letter on last side
      setSelected((record.solution.length / 4) * 3 + (width - 1));
      // setInitialRotations(rotations);
      // showIntroAnimation(true);
      showRippleAnimation();
      setIsInitialized(true);
      if (onInitialize) {
        onInitialize();
      }
    },
    // Only run once on load
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ref],
  );

  // Need to rerender the letters if the character position changes 👆🏻
  useEffect(() => {
    if (ref == null || hasRetrievedGameState == false) return;
    ref.geometry.attributes.characterPosition.needsUpdate = true;
  }, [characterPositionArray, hasRetrievedGameState, ref]);

  // This does all of the selection logic. Row/cell highlighting, etc.
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
        if (selected != null && isVisibleSide(selected) === true) {
          // We default to the selected cell for the first place in the word
          // and will override this if it is not the first place below
          const cell = record.solution[selected];
          if (cell != null && cell !== '#' && typeof cell.cell === 'number') {
            setSelectedWordCell(cell.cell);
          }

          // We need to check if the selected cell is on the same side as the hovered cell in the case of the
          // first column (which is from the previous side)
          const sSide = Math.ceil(selected / totalPerSide) - 1;
          const isSameSide = sSide === selectedSide;
          // const selectedCellX = selected % width;
          const selectedCellY = Math.max(
            0,
            Math.ceil((selected - sSide * totalPerSide) / width) - 1,
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
                  : totalPerSide * puzzle.data.length -
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
    (key: string, selectedOverride?: number) => {
      const selectedIndex = selectedOverride ?? selected;

      if (isVisibleSide(selectedIndex) === false && selectedOverride == null) {
        return;
      }

      const coord = characterTextureAtlasLookup[key.toUpperCase()];
      if (selectedIndex != null && ref != null) {
        const x =
          coord == null || key === '' || key === 'BACKSPACE' ? -1 : coord[0];
        const y =
          coord == null || key === '' || key === 'BACKSPACE' ? -1 : coord[1];
        setLastCurrentKey(key);

        if (x !== -1) {
          // select the next cell
          const nextCell = selectedIndex + getInterval();
          const sSide = Math.ceil(selectedIndex / totalPerSide) - 1;
          const side = Math.ceil(nextCell / totalPerSide) - 1;
          const selectedX = nextCell % width;
          const selectedY = Math.max(
            0,
            Math.ceil((selectedIndex - sSide * totalPerSide) / width) - 1,
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
          characterPositionArray[selectedIndex * 2] === -1 ||
          lastCurrentKey === '' ||
          lastCurrentKey === 'BACKSPACE'
        ) {
          // select the previous cell
          const nextCell = selectedIndex - getInterval();
          const selectedX = nextCell % width;
          const sSide = Math.ceil(selectedIndex / totalPerSide) - 1;

          // We need to check if we are on the first cell of a row
          // and if it is, we check the previous sides last row for a letter
          if (selectedX === 0) {
            const int =
              selectedSide !== 0
                ? nextCell - (width * width - (width - 1))
                : totalPerSide * puzzle.data.length -
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

        const cell = record.solution[selectedIndex];
        if (cell !== '#') {
          const chunk = Math.floor(selectedIndex / 32);
          const bit = selectedIndex % 32;
          const isCorrect =
            !(key === '' || key === 'BACKSPACE') &&
            cell.value.toUpperCase() === key.toUpperCase();
          const newAnswerIndex = [...answerIndex];
          if (isCorrect) {
            // This flips the index bit to 1 (true)
            newAnswerIndex[chunk] |= 1 << bit;
          } else {
            // This flips the index bit to 0 (false)
            newAnswerIndex[chunk] &= ~(1 << bit);
          }
          addAnswerIndex(newAnswerIndex);
        }

        characterPositionArray[selectedIndex * 2] = x;
        characterPositionArray[selectedIndex * 2 + 1] = y;

        addCharacterPosition(characterPositionArray);

        ref.geometry.attributes.characterPosition.needsUpdate = true;

        if (onLetterInput) {
          onLetterInput();
        }
      }
    },
    [
      selected,
      isVisibleSide,
      characterTextureAtlasLookup,
      ref,
      characterPositionArray,
      lastCurrentKey,
      record.solution,
      addCharacterPosition,
      onLetterInput,
      getInterval,
      totalPerSide,
      width,
      selectedSide,
      height,
      isVerticalOrientation,
      puzzle.data.length,
      answerIndex,
      addAnswerIndex,
    ],
  );

  /**
   * For debug purposes
   */
  useEffect(() => {
    if (keyAndIndexOverride != null) {
      onLetterChange(keyAndIndexOverride[0], keyAndIndexOverride[1]);
    }
    // Adding onLetterChange here causes multiple letter renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyAndIndexOverride]);

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
    [characterTextureAtlas, numberTextureAtlas],
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
    [characterTextureAtlas, numberTextureAtlas],
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
    [characterTextureAtlas, numberTextureAtlas],
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
    [characterTextureAtlas, numberTextureAtlas],
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
    [characterTextureAtlas, numberTextureAtlas],
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
    [characterTextureAtlas, numberTextureAtlas],
  );

  const onPointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      // Check if the user is hovering over a cell as the visible side
      if (isVisibleSide(e.instanceId) === false) {
        return;
      }

      e.stopPropagation();
      setHovered(e.instanceId);
    },
    [isVisibleSide],
  );

  const onPointerOut = useCallback(() => setHovered(undefined), []);

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      // Check if the user is selecting the cell as the visible side
      if (isVisibleSide(e.instanceId) === false) {
        return;
      }

      if (e.instanceId === selected) {
        onVerticalOrientationChange(!isVerticalOrientation);
        // setVerticalOrientation(!isVerticalOrientation);
        return;
      }

      e.stopPropagation();
      setSelected(e.instanceId);
    },
    [
      isVerticalOrientation,
      isVisibleSide,
      onVerticalOrientationChange,
      selected,
    ],
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
