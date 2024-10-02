import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ThreeEvent, extend, useFrame, useLoader } from '@react-three/fiber';
import {
  TextureLoader,
  RepeatWrapping,
  Vector3,
  Euler,
  Mesh,
  Quaternion,
  Texture,
} from 'three';
import { InstancedMesh } from 'three';
import { rotateAroundPoint } from '../../../../lib/utils/three';
import {
  SequenceKeys,
  getRangeForCell,
  isCellWithNumber,
} from '../../../../lib/utils/puzzle';
import { useScaleRippleAnimation } from '../../../../lib/utils/hooks/animations/useScaleRippleAnimation';
import { useScaleAnimation } from 'lib/utils/hooks/animations/useScaleAnimation';
import { hexToVector } from 'lib/utils/color';
import { constrain, rangeOperation } from 'lib/utils/math';
import { RoundedBoxGeometry } from 'components/three/RoundedBoxGeometry';
import { MeshTransmissionMaterial, useTexture } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import PulsatingLight from '../PulsatingLight';
import { PuzzleType } from 'types/types';
import { AtlasType } from 'lib/utils/atlas';
import {
  CUBE_SIZE,
  CellStyleEnum,
  CubeSidesEnum,
  MatcapIndexEnum,
  ROUNDED_CUBE_SIZE,
  Uniforms,
  createBasicMaterial,
  createCellsMaterial,
  tempObject,
  uniformDefaults,
  updateCubeSideDisplay,
} from './utils';
extend({ RoundedBoxGeometry });

export type LetterBoxesProps = {
  puzzle: PuzzleType;
  characterTextureAtlasLookup: AtlasType;
  cellNumberTextureAtlasLookup: AtlasType;
  svgTextureAtlasLookup?: AtlasType;
  svgTextureAtlas?: Texture;
  svgGridSize?: number;
  currentKey?: string | undefined;
  selected: number | undefined;
  onSelectedChange: (selected: InstancedMesh['id'] | undefined) => void;
  selectedSide: number;
  fontColor: number;
  fontDraftColor: number;
  selectedColor: number;
  errorColor: number;
  correctColor: number;
  keyAndIndexOverride?: [string, number]; // For testing
  isVerticalOrientation: boolean;
  characterPositionArray: Float32Array;
  cellValidationArray: Int16Array;
  cellDraftModeArray: Int16Array;
  autoCheckEnabled: boolean;
  selectNextBlankEnabled: boolean;
  autoNextEnabled: boolean;
  updateCharacterPosition: (
    selectedIndex: number,
    key: string,
    x: number,
    y: number,
  ) => boolean;
  onVerticalOrientationChange: (isVerticalOrientation: boolean) => void;
  setInstancedMesh?: (instancedMesh: InstancedMesh | null) => void;
  onLetterInput?: () => void;
  onInitialize?: () => void;
  turnLeft: (offset?: number) => void;
  turnRight: (offset?: number) => void;
  setGoToNextWord?: (
    callback: (selected: number, polarity: 1 | -1) => void,
  ) => void;
  theme?: string;
  isSpinning?: boolean;
  isSingleSided?: boolean;
};

export const LetterBoxes: React.FC<LetterBoxesProps> = ({
  puzzle,
  svgTextureAtlasLookup,
  svgTextureAtlas,
  svgGridSize,
  selected,
  onSelectedChange,
  characterTextureAtlasLookup,
  cellNumberTextureAtlasLookup,
  isVerticalOrientation = false,
  onVerticalOrientationChange,
  setInstancedMesh,
  selectedSide,
  keyAndIndexOverride,
  currentKey,
  updateCharacterPosition,
  characterPositionArray,
  onLetterInput,
  fontColor,
  fontDraftColor,
  selectedColor,
  errorColor,
  correctColor,
  onInitialize,
  cellValidationArray,
  cellDraftModeArray,
  autoNextEnabled,
  selectNextBlankEnabled,
  turnLeft,
  turnRight,
  setGoToNextWord,
  theme,
  isSingleSided,
}) => {
  const [cellPositions, setCellPositions] = useState<Record<number, Vector3>>(
    {},
  );
  const selectedCellRef = useRef<Mesh>(null);

  const [lightPosition, setLightPosition] = useState(new Vector3(0, 0, 0));

  const characterTextureAtlas = useLoader(TextureLoader, '/texture_atlas.webp');
  useEffect(() => {
    characterTextureAtlas.wrapS = RepeatWrapping;
    characterTextureAtlas.wrapT = RepeatWrapping;
  }, [characterTextureAtlas]);

  const numberTextureAtlas = useLoader(TextureLoader, '/number_atlas.webp');
  useEffect(() => {
    numberTextureAtlas.wrapS = RepeatWrapping;
    numberTextureAtlas.wrapT = RepeatWrapping;
  }, [numberTextureAtlas]);

  const [cellsDisplayRef, setCellsDisplayRef] = useState<InstancedMesh | null>(
    null,
  );
  const [cellsRef, setCellsRef] = useState<InstancedMesh | null>(null);
  const [prevOrientation, setPrevOrientation] = useState<boolean>(
    isVerticalOrientation,
  );

  const [hovered, setHovered] = useState<InstancedMesh['id']>();
  const [prevHover, setPrevHovered] = useState<InstancedMesh['id']>();
  const [prevTheme, setPrevTheme] = useState<string>();
  const [prevSelected, setPrevSelected] = useState<InstancedMesh['id']>();
  const [prevSelectedSide, setPrevSelectedSide] =
    useState<LetterBoxesProps['selectedSide']>();
  const [clueMap, setClueMap] = useState<Record<number, number>>({});
  const convertedFontColor = useMemo(() => hexToVector(fontColor), [fontColor]);
  const convertedFontDraftColor = useMemo(
    () => hexToVector(fontDraftColor),
    [fontDraftColor],
  );
  const convertedErrorColor = useMemo(
    () => hexToVector(errorColor),
    [errorColor],
  );
  const convertedCorrectColor = useMemo(
    () => hexToVector(correctColor),
    [correctColor],
  );

  const uniforms: Uniforms = useMemo(
    () => ({
      svgTexture: { value: svgTextureAtlas },
      svgGridSize: { value: svgGridSize },
      useSvgTexture: { value: svgTextureAtlasLookup != null },
      numberTexture: { value: numberTextureAtlas },
      characterTexture: { value: characterTextureAtlas },
      fontColor: { value: convertedFontColor },
      fontDraftColor: { value: convertedFontDraftColor },
      errorColor: { value: convertedErrorColor },
      correctColor: { value: convertedCorrectColor },
      shrinkFactor: { value: 0.9 }, // Adjust this value to control shrinking (e.g., 0.9 for 90% size)
      ...uniformDefaults,
    }),
    [
      characterTextureAtlas,
      convertedCorrectColor,
      convertedErrorColor,
      convertedFontColor,
      convertedFontDraftColor,
      numberTextureAtlas,
      svgGridSize,
      svgTextureAtlas,
      svgTextureAtlasLookup,
    ],
  );

  useEffect(() => {
    if (setInstancedMesh) {
      setInstancedMesh(cellsDisplayRef);
    }
  }, [cellsDisplayRef, setInstancedMesh]);

  const [width, height, rowLength] = useMemo(() => {
    let { width, height } = puzzle.data[0].dimensions;
    return [width, height, width * puzzle.data.length - puzzle.data.length];
  }, [puzzle.data]);

  const [record, size] = useMemo(() => {
    return [puzzle.record, puzzle.record.solution.length];
  }, [puzzle.record]);

  const cellNumberPositionArray = useMemo(
    () => Float32Array.from(new Array(size * 2).fill(-1)),
    [size],
  );

  const cubeSideDisplayArray = useMemo(
    () => Int32Array.from(new Array(size * 2).fill(0)),
    [size],
  );

  const cellStyleArray = useMemo(() => {
    const arr = Uint8Array.from(new Array(size).fill(CellStyleEnum.None));
    for (let x = 0; x < puzzle.record.solution.length; x++) {
      const { style } = puzzle.record.solution[x];
      if (style?.shapebg === 'circle') {
        arr[x] = CellStyleEnum.Circle;
      }
    }
    return arr;
  }, [size, puzzle.record.solution]);

  const matcapIndexArray = useMemo(
    () => Float32Array.from(new Array(size).fill(0)),
    [size],
  );

  const visibilityArray = useMemo(
    () => Float32Array.from(new Array(size).fill(1)),
    [size],
  );

  const updateVisibility = useCallback(
    (index: number, isVisible: boolean) => {
      if (cellsRef) {
        visibilityArray[index] = isVisible ? 1 : 0;
        cellsRef.geometry.attributes.visibility.needsUpdate = true;
      }
    },
    [cellsRef, visibilityArray],
  );

  useEffect(() => {
    if (cellsDisplayRef == null) return;
    cellsDisplayRef.geometry.attributes.cellStyle.needsUpdate = true;
  }, [cellStyleArray, cellsDisplayRef]);

  useEffect(() => {
    if (cellsDisplayRef == null) return;
    cellsDisplayRef.geometry.attributes.cellValidation.needsUpdate = true;
  }, [cellValidationArray, cellsDisplayRef]);

  useEffect(() => {
    if (cellsDisplayRef == null) return;
    cellsDisplayRef.geometry.attributes.cellDraftMode.needsUpdate = true;
  }, [cellDraftModeArray, cellsDisplayRef]);

  useEffect(() => {
    if (cellsDisplayRef == null) return;
    cellsDisplayRef.geometry.attributes.characterPosition.needsUpdate = true;
  }, [characterPositionArray, cellsDisplayRef]);

  const cellBelongsOnSide = useCallback(
    (id?: number, side?: number) => {
      if (id == null || side == null) {
        return false;
      }
      return Object.keys(record.solution[id].mapping ?? []).includes(
        side.toString(),
      );
    },
    [record.solution],
  );

  const isVisibleSide = useCallback(
    (selected?: number) => {
      if (selected == null) {
        return false;
      }

      return cellBelongsOnSide(selected, selectedSide);
    },
    [cellBelongsOnSide, selectedSide],
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
    puzzle.data.length,
    [cellsDisplayRef, cellsRef, selectedCellRef.current],
  );

  const showScaleAnimation = useScaleAnimation([
    cellsDisplayRef,
    cellsRef,
    selectedCellRef.current,
  ]);

  // Initial setup (orient the instanced boxes)
  useEffect(
    () => {
      if (cellsDisplayRef == null || cellsRef == null) return;

      const positions: Record<number, Vector3> = {};
      const rotations: Euler[] = [];
      const tempCellMapping: Record<number, number> = {};

      for (let j = 0; j < record.solution.length; j++) {
        const { x, y, value: cell } = record.solution[j];

        tempObject.rotation.set(0, 0, 0);
        tempObject.scale.set(1, 1, 1);
        const side = Math.floor((j % rowLength) / (width - 1));

        updateCubeSideDisplay(cubeSideDisplayArray, j, x);

        if (isCellWithNumber(cell)) {
          // select first cell
          if (cell.cell === 1) {
            onSelectedChange(j);
          }
          cellNumberPositionArray[j * 2] =
            cellNumberTextureAtlasLookup[cell.cell][0];
          cellNumberPositionArray[j * 2 + 1] =
            cellNumberTextureAtlasLookup[cell.cell][1];

          tempCellMapping[cell.cell] = j;
        }

        if (side === 0) {
          tempObject.position.set(
            -x + height - 1,
            -y + height - 1,
            -height + 1,
          );
        } else if (side === 1) {
          tempObject.position.set(-x + height - 1, -y + height - 1, 0);
          rotateAroundPoint(
            tempObject,
            new Vector3(0, 0, 0),
            new Vector3(0, 1, 0),
            Math.PI / 2,
            true,
          );
        } else if (side === 2) {
          tempObject.position.set(-x, -y + height - 1, 0);
          rotateAroundPoint(
            tempObject,
            new Vector3(0, 0, 0),
            new Vector3(0, 1, 0),
            Math.PI,
            true,
          );
        } else if (side === 3) {
          tempObject.position.set(-x, -y + height - 1, -height + 1);
          rotateAroundPoint(
            tempObject,
            new Vector3(0, 0, 0),
            new Vector3(0, 1, 0),
            -Math.PI / 2,
            true,
          );
        }

        matcapIndexArray[j] = MatcapIndexEnum.default;
        if (cell === '#') {
          // hide all cells that aren't part of the single side
          if (
            isSingleSided === true &&
            Math.floor((j % rowLength) / width) !== 0 // first side including last column
          ) {
            tempObject.scale.set(0, 0, 0);
          }
          matcapIndexArray[j] = MatcapIndexEnum.blank;
        }

        tempObject.updateMatrix();
        cellsDisplayRef.setMatrixAt(j, tempObject.matrix);
        cellsRef.setMatrixAt(j, tempObject.matrix);
        rotations[j] = new Euler().copy(tempObject.rotation);
        positions[j] = new Vector3().copy(tempObject.position);
      }

      setCellPositions(positions);
      setClueMap(tempCellMapping);

      cellsDisplayRef.geometry.attributes.cellStyle.needsUpdate = true;
      cellsDisplayRef.geometry.attributes.characterPosition.needsUpdate = true;
      cellsDisplayRef.geometry.attributes.cellNumberPosition.needsUpdate = true;
      cellsDisplayRef.geometry.attributes.cubeSideDisplay.needsUpdate = true;
      cellsDisplayRef.instanceMatrix.needsUpdate = true;

      cellsRef.geometry.attributes.matcapIndex.needsUpdate = true;
      cellsRef.instanceMatrix.needsUpdate = true;
      // setInitialRotations(rotations);
      // showIntroAnimation(true);
      if (onInitialize) {
        onInitialize();
      }
      showRippleAnimation();
    },
    // Only run once on load
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cellsDisplayRef],
  );

  const lastPosition = useRef<Vector3>(new Vector3(0, 0, 0));

  // Need to rerender the letters if the character position changes 👆🏻
  useEffect(() => {
    if (cellsDisplayRef == null) return;
    cellsDisplayRef.geometry.attributes.characterPosition.needsUpdate = true;
  }, [characterPositionArray, cellsDisplayRef]);

  const [springs, api] = useSpring(() => ({
    scale: [1, 1, 1],
    config: { mass: 0.1, tension: 500, friction: 5, duration: 50 },
  }));

  // This does all of the selection logic. Row/cell highlighting, etc.
  useFrame((state) => {
    if (cellsDisplayRef == null || cellsRef == null) return;
    for (let id = 0; id < record.solution.length; id++) {
      updateVisibility(id, true);
      if (
        prevHover !== hovered ||
        prevSelected !== selected ||
        prevOrientation !== isVerticalOrientation ||
        prevSelectedSide !== selectedSide ||
        prevTheme !== theme
      ) {
        if (prevTheme !== theme) {
          showRippleAnimation();
        }

        // Store the prev so we can avoid this calculation next time
        setPrevHovered(hovered);
        setPrevSelected(selected);
        setPrevSelectedSide(selectedSide);
        setPrevOrientation(isVerticalOrientation);
        setPrevTheme(theme);

        const { solution } = record;
        const cell = solution[id];

        if (cell.value !== '#' && id !== hovered && id !== selected) {
          matcapIndexArray[id] = MatcapIndexEnum.default;
        } else if (id === hovered) {
          matcapIndexArray[id] = MatcapIndexEnum.adjacent;
        }

        if (selected != null && isVisibleSide(selected) === true) {
          const range = getRangeForCell(
            puzzle,
            selected,
            selectedSide,
            isVerticalOrientation,
          );
          if (range.length > 1) {
            range.forEach((index) => {
              if (index === selected) return;
              matcapIndexArray[index] = MatcapIndexEnum.adjacent;
            });
          }
        }

        cellsRef.geometry.attributes.matcapIndex.needsUpdate = true;
      }
    }

    if (selected != null) {
      // Selected cell is no longer visible
      updateVisibility(selected, false);

      if (
        lastPosition.current == null ||
        cellPositions[selected] == null ||
        lastPosition.current.equals(cellPositions[selected]) === false
      ) {
        const targetPosition = cellPositions[selected];
        setLightPosition(targetPosition);

        api.start({
          to: async (next) => {
            await next({ scale: [0.95, 0.95, 0.95] });
            await next({
              scale: [1, 1, 1],
            });
          },
          onChange: function (state) {
            cellsDisplayRef.getMatrixAt(selected, tempObject.matrix);

            // Extract position, rotation, and scale from the original matrix
            const position = new Vector3();
            const quaternion = new Quaternion();
            const scale = new Vector3();
            tempObject.matrix.decompose(position, quaternion, scale);

            // Update position
            position.copy(targetPosition);

            // Update scale
            scale.set(
              state.value.scale[0],
              state.value.scale[1],
              state.value.scale[2],
            );

            // Recompose the matrix with updated position and scale, but original rotation
            tempObject.matrix.compose(position, quaternion, scale);

            cellsDisplayRef.setMatrixAt(selected, tempObject.matrix);
            cellsDisplayRef.instanceMatrix.needsUpdate = true;
          },
        });

        lastPosition.current = targetPosition;
      }
    }
  });

  const numClues = useMemo(() => {
    const { across, down } = puzzle.record.clues;
    let highest = 1;
    const index = Math.max(across.length, down.length);
    for (let i = 0; i < index; i++) {
      const acrossClue = across[i];
      const downClue = down[i];
      highest = Math.max(
        highest,
        acrossClue?.number ?? 0,
        downClue?.number ?? 0,
      );
    }
    return highest;
  }, [puzzle.record.clues]);

  // Much simpler navigation for single-sided emoji based puzzles.
  // We only go to the next numbered cell in order no matter the orientation.
  const goToNextCell = useCallback(
    (selected: number, polarity: 1 | -1 = 1) => {
      // Always default to horizontal when using emojis
      const range = getRangeForCell(puzzle, selected, selectedSide, false);
      const { solution } = puzzle.record;
      const rootWord = solution[range[0]];
      if (
        rootWord != null &&
        isCellWithNumber(rootWord.value) &&
        typeof rootWord.value.cell === 'number'
      ) {
        const { cell: cellNumber } = rootWord.value;
        const nextSequenceIndex = rangeOperation(
          1,
          numClues,
          cellNumber,
          polarity,
        );
        onSelectedChange(clueMap[nextSequenceIndex]);
      }
    },
    [clueMap, numClues, onSelectedChange, puzzle, selectedSide],
  );

  const goToNextWord = useCallback(
    (selected: number, polarity: 1 | -1 = 1) => {
      // Only use simple selection method for single-sided emoji puzzles
      if (isSingleSided === true && svgTextureAtlas != null) {
        goToNextCell(selected, polarity);
        return;
      }

      const { solution, wordSequencesBySideFlat } = record;
      const cell = solution[selected];

      if (cell?.mapping == null) {
        return;
      }

      const direction: SequenceKeys = isVerticalOrientation ? 'down' : 'across';
      const sequenceIndex = isVerticalOrientation
        ? cell?.mapping[selectedSide]?.downSequenceIndex
        : cell?.mapping[selectedSide]?.acrossSequenceIndex;

      let sequences = wordSequencesBySideFlat[direction];

      const currentIndex = sequences.findIndex(
        (i) => i.index == sequenceIndex && i.side == selectedSide,
      );

      const nextSequenceIndex =
        sequences[constrain(0, sequences.length - 1, currentIndex + polarity)]
          .index;
      let nextIndex = sequences.findIndex((i) => i.index == nextSequenceIndex);

      // In the case of the shared columns,
      // we need to move it to the next spot on the other side
      // where the vertical sequence is x != 0
      if (
        isVerticalOrientation &&
        cell.x === 0 &&
        sequences[currentIndex].side != sequences[nextIndex].side
      ) {
        // Search for the next cell that is not x = 0
        // If you can't find it, default to the cell above
        for (let i = 0; i < sequences.length; i++) {
          const tempIndex = constrain(
            0,
            sequences.length - 1,
            nextIndex + i * polarity,
          );
          const { sequence } = sequences[tempIndex];
          const cell = solution[sequence[0]];
          if (cell.x !== 0) {
            nextIndex = tempIndex;
            break;
          }
        }
      }

      // Find the next cell and default to it
      let nextCell = sequences[nextIndex];
      let nextSelected =
        nextCell.sequence[polarity === 1 ? 0 : nextCell.sequence.length - 1];

      if (selectNextBlankEnabled === true) {
        let shouldBreak: boolean = false;
        // Look for next blank cell. If there isn't one, default to the very next cell
        // as if selectNextBlank is false
        for (let i = 0; i < sequences.length; i++) {
          const tempIndex = constrain(
            0,
            sequences.length - 1,
            nextIndex + i * polarity,
          );
          const { sequence } = sequences[tempIndex];
          const start = polarity === 1 ? 0 : sequence.length;
          const end = polarity === 1 ? sequence.length : 0;
          for (
            let y = start;
            polarity === 1 ? y < end : y > end;
            y += polarity
          ) {
            // Look for empty cells
            if (
              characterPositionArray[sequence[y] * 2] === -1 &&
              characterPositionArray[sequence[y] * 2 + 1] === -1
            ) {
              nextCell = sequences[tempIndex];
              nextSelected = sequence[y];
              shouldBreak = true;
              break;
            }
          }
          if (shouldBreak === true) {
            break;
          }
        }
      }

      onSelectedChange(nextSelected);
      if (isSingleSided === false && nextCell.side !== selectedSide) {
        let numSides = 0;
        while (numSides < puzzle.data.length) {
          numSides++;
          if (
            constrain(
              0,
              puzzle.data.length - 1,
              selectedSide + numSides * polarity,
            ) === nextCell.side
          ) {
            break;
          }
        }
        if (polarity === 1) {
          turnRight(numSides);
        } else {
          turnLeft(numSides);
        }
      }
    },
    [
      isSingleSided,
      svgTextureAtlas,
      record,
      isVerticalOrientation,
      selectedSide,
      selectNextBlankEnabled,
      onSelectedChange,
      goToNextCell,
      characterPositionArray,
      puzzle.data.length,
      turnRight,
      turnLeft,
    ],
  );

  useEffect(() => {
    if (setGoToNextWord) {
      setGoToNextWord(goToNextWord);
    }
  }, [goToNextWord, setGoToNextWord]);

  const onLetterChange = useCallback(
    (key: string, selectedOverride?: number) => {
      if (onLetterInput) {
        onLetterInput();
      }

      const selectedIndex = selectedOverride ?? selected;

      if (isVisibleSide(selectedIndex) === false && selectedOverride == null) {
        return;
      }

      const coord = (svgTextureAtlasLookup ?? characterTextureAtlasLookup)[
        key.toUpperCase()
      ];
      if (
        selectedIndex != null &&
        cellsDisplayRef != null &&
        (coord != null || key === '' || key === 'BACKSPACE')
      ) {
        const x = key === '' || key === 'BACKSPACE' ? -1 : coord[0];
        const y = key === '' || key === 'BACKSPACE' ? -1 : coord[1];

        if (updateCharacterPosition(selectedIndex, key, x, y) === true) {
          showScaleAnimation(selectedIndex);
        }

        /**
         * This is the logic for moving to the next or prev cell
         */

        const { solution, wordSequencesBySide } = record;
        const cell = solution[selectedIndex];

        if (cell?.mapping != null) {
          const direction: SequenceKeys = isVerticalOrientation
            ? 'down'
            : 'across';
          const sequenceIndex = isVerticalOrientation
            ? cell?.mapping[selectedSide]?.downSequenceIndex
            : cell?.mapping[selectedSide]?.acrossSequenceIndex;

          if (sequenceIndex != null) {
            const range =
              wordSequencesBySide[selectedSide][direction][sequenceIndex];
            if (range == null) return;
            const sIndex = range.findIndex((i) => i === selectedIndex);
            if (x !== -1) {
              // Are we on the last letter in the sequence?
              if (sIndex > -1 && sIndex < range.length - 1) {
                // Update letter and move to the next cell
                const nextCell = range[sIndex + 1];
                onSelectedChange(nextCell);
              } else if (autoNextEnabled === true) {
                goToNextWord(selectedIndex, 1);
              }
            } else {
              // Delete letter and move to the previous cell
              // Are we on the first letter in the sequence?
              if (sIndex > 0) {
                // Update letter and move to the previous cell
                const nextCell = range[sIndex - 1];
                onSelectedChange(nextCell);
              } else if (autoNextEnabled === true) {
                goToNextWord(selectedIndex, -1);
              }
            }
          }
        }
      }
    },
    [
      onLetterInput,
      selected,
      isVisibleSide,
      svgTextureAtlasLookup,
      characterTextureAtlasLookup,
      cellsDisplayRef,
      updateCharacterPosition,
      record,
      showScaleAnimation,
      isVerticalOrientation,
      selectedSide,
      autoNextEnabled,
      onSelectedChange,
      goToNextWord,
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

  // Set up materials for the cube faces (letters, emojis, status, etc)
  const side0 = useMemo(
    () => createBasicMaterial(uniforms, CubeSidesEnum.one),
    [uniforms],
  );
  const side1 = useMemo(
    () => createBasicMaterial(uniforms, CubeSidesEnum.two),
    [uniforms],
  );
  const side2 = useMemo(
    () => createBasicMaterial(uniforms, CubeSidesEnum.three),
    [uniforms],
  );
  const side3 = useMemo(
    () => createBasicMaterial(uniforms, CubeSidesEnum.four),
    [uniforms],
  );
  const side4 = useMemo(
    () => createBasicMaterial(uniforms, CubeSidesEnum.five),
    [uniforms],
  );
  const side5 = useMemo(
    () => createBasicMaterial(uniforms, CubeSidesEnum.six),
    [uniforms],
  );

  const cellTextureAtlas = useTexture('/cell_matcap_512.png');
  const blankTextureAtlas = useTexture('/blank_matcap_512.png');

  const cellsUniforms: Uniforms = useMemo(
    () => ({
      cellTextureAtlas: { value: cellTextureAtlas },
      blankTextureAtlas: { value: blankTextureAtlas },
      adjacentColor: { value: hexToVector(selectedColor) },
    }),
    [blankTextureAtlas, cellTextureAtlas, selectedColor],
  );

  // Set up materials for the interactive cells
  const cellsSide0 = useMemo(
    () => createCellsMaterial(cellsUniforms, CubeSidesEnum.one),
    [cellsUniforms],
  );

  // Set up materials for the blank cells

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
      onSelectedChange(e.instanceId);
    },
    [
      isVerticalOrientation,
      isVisibleSide,
      onSelectedChange,
      onVerticalOrientationChange,
      selected,
    ],
  );

  return (
    <>
      <instancedMesh
        ref={setCellsDisplayRef}
        args={[undefined, undefined, size]}
        renderOrder={1}
        material={[side0, side1, side2, side3, side4, side5]}
      >
        <boxGeometry args={CUBE_SIZE}>
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
            attach="attributes-cellValidation"
            count={cellValidationArray.length}
            itemSize={2}
            array={cellValidationArray}
          />
          <instancedBufferAttribute
            attach="attributes-cellDraftMode"
            count={cellDraftModeArray.length}
            itemSize={2}
            array={cellDraftModeArray}
          />
          <instancedBufferAttribute
            attach="attributes-cellStyle"
            count={cellStyleArray.length}
            itemSize={1}
            array={cellStyleArray}
          />
        </boxGeometry>
      </instancedMesh>
      <instancedMesh
        ref={setCellsRef}
        args={[undefined, undefined, size]}
        onPointerMove={onPointerMove}
        onPointerOut={onPointerOut}
        onPointerDown={onPointerDown}
        renderOrder={0}
        material={cellsSide0}
      >
        <roundedBoxGeometry args={ROUNDED_CUBE_SIZE}>
          <instancedBufferAttribute
            attach="attributes-matcapIndex"
            count={matcapIndexArray.length}
            itemSize={1}
            array={matcapIndexArray}
          />
          <instancedBufferAttribute
            attach="attributes-visibility"
            count={visibilityArray.length}
            itemSize={1}
            array={visibilityArray}
          />
        </roundedBoxGeometry>
      </instancedMesh>
      <PulsatingLight position={lightPosition} color={selectedColor} />
      <animated.mesh
        ref={selectedCellRef}
        scale={springs.scale.to((x, y, z) => [x, y, z])}
        position={lightPosition}
      >
        <roundedBoxGeometry args={ROUNDED_CUBE_SIZE} />
        <MeshTransmissionMaterial
          color={selectedColor}
          backside={true}
          distortion={1}
          chromaticAberration={1}
          anisotropicBlur={1}
          transmission={0.5}
          backsideThickness={0.0}
          thickness={0.2}
          samples={4}
          resolution={256}
          roughness={0.33}
          metalness={0.0}
          anisotropy={1}
          backsideResolution={256}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </animated.mesh>
    </>
  );
};

export default LetterBoxes;
