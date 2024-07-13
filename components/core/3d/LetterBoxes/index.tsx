import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ThreeEvent, extend, useFrame, useLoader } from '@react-three/fiber';
import {
  TextureLoader,
  RepeatWrapping,
  Vector3,
  Object3D,
  Color,
  Euler,
  Texture,
  Vector4,
} from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import { InstancedMesh, MeshPhysicalMaterial } from 'three';
import { rotateAroundPoint } from '../../../../lib/utils/three';
import { SequenceKeys, isCellWithNumber } from '../../../../lib/utils/puzzle';
import { useScaleRippleAnimation } from '../../../../lib/utils/hooks/animations/useScaleRippleAnimation';
import { PuzzleType } from 'types/types';
import { useScaleAnimation } from 'lib/utils/hooks/animations/useScaleAnimation';
import { hexToVector } from 'lib/utils/color';
import { constrain } from 'lib/utils/math';
import { RoundedBoxGeometry } from 'components/three/RoundedBoxGeometry';
import { AtlasType } from 'lib/utils/atlas';
extend({ RoundedBoxGeometry });

export enum CubeSidesEnum {
  one = 1 << 0,
  two = 1 << 1,
  three = 1 << 2,
  four = 1 << 3,
  five = 1 << 4,
  six = 1 << 5,
}

const vertexShader = `
  attribute vec2 cellValidation;
  attribute vec2 cellDraftMode;
  attribute vec2 characterPosition;
  attribute vec2 cellNumberPosition;
  attribute vec3 cellColor;
  in ivec2 cubeSideDisplay;
  
  varying vec2 vUv;
  varying vec2 vCellValidation;
  varying vec2 vCellDraftMode;
  varying vec2 vCharacterPosition;
  varying vec2 vCellNumberPosition;
  varying vec3 vCellColor;
  flat out ivec2 vCubeSideDisplay;

  void main()
  {
      vUv = uv;
      vCellValidation = cellValidation;
      vCellDraftMode = cellDraftMode;
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

  uniform uint sideIndex;
  uniform sampler2D numberTexture;
  uniform sampler2D characterTexture;
  uniform sampler2D svgTexture;
  uniform bool useSvgTexture;
  uniform float charactersGridSize;
  uniform float svgGridSize;
  uniform float borderRadius;
  uniform vec4 borderColor;
  uniform float errorWidth;
  uniform vec4 errorColor;
  uniform vec4 correctColor;
  uniform vec4 fontColor;
  uniform vec4 fontDraftColor;
  
  varying vec2 vUv;
  varying vec2 vCellValidation;
  varying vec2 vCellDraftMode;
  varying vec2 vCharacterPosition;
  varying vec2 vCellNumberPosition;
  varying vec3 vCellColor;
  flat varying ivec2 vCubeSideDisplay;

  vec4 applyColorChange(vec4 color, vec4 newColor) {
    return vec4(newColor.rgb, color.a); // Change white to the target color
  }

  float borderSDF(vec2 uv, vec2 size, float radius, float width) {
    uv = uv * 2.0 - 1.0;
    vec2 d = abs(uv) - size + vec2(radius);
    float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - radius;
    return smoothstep(width, width + fwidth(dist), dist);
  }

  void main(void)
  {
    vec3 c = vCellColor.rgb;
    
    // Here we paint all of our textures

    // Show character when bitflag is on for the side
    if ((uint(vCubeSideDisplay.x) & sideIndex) == sideIndex) {
      // Draw the letter or emoji
      // A coord of -1, -1 means do not paint
      if (vCharacterPosition.x >= 0.0 && vCharacterPosition.y >= 0.0) {
        vec2 position, size, coord;
        vec4 Ca;
        if (useSvgTexture == true) {
          // CanvasTexture uses a flipped coordinate system
          position = vec2(vCharacterPosition.x/svgGridSize, 1.0 - (vCharacterPosition.y/svgGridSize + 1.0/svgGridSize));
          size = vec2(1.0 / svgGridSize, 1.0 / svgGridSize);
          coord = position + size * fract(vUv);
          Ca = texture2D(svgTexture, coord);
        } else {
          position = vec2(vCharacterPosition.x/charactersGridSize, -(vCharacterPosition.y/charactersGridSize + 1.0/charactersGridSize));
          size = vec2(1.0 / charactersGridSize, 1.0 / charactersGridSize);
          coord = position + size * fract(vUv);
          Ca = texture2D(characterTexture, coord);
          // Apply color change to the texture color
          Ca = applyColorChange(Ca, fontColor);
        }

        if (vCellValidation.x == 2.0) {
          // Draw the mark for a correct letter
          if (vUv.y > (1.0 - vUv.x + 0.75)) {
            c = correctColor.rgb;
          } 
        } else {
          if (vCellDraftMode.x > 0.0) {
            if (useSvgTexture == true) {
              // Blend the SVG texture with the fontDraftColor
              vec3 tintedColor = Ca.rgb * fontDraftColor.rgb;
              Ca.rgb = mix(Ca.rgb, tintedColor, 0.75);
              Ca.a = Ca.a * 0.75;
            } else {
              // Draw font draft color
              Ca = applyColorChange(Ca, fontDraftColor);
            }
          }
          // 1.0 means we have an incorrect letter
          if (vCellValidation.x > 0.0 && vCellValidation.x < 2.0) {
            // Draw the diagonal mark for an incorrect letter
            // Calculate the distance to the diagonal line (y = x)
            float distance = abs(vUv.y - vUv.x);
            if (distance < errorWidth) {
              c = errorColor.rgb * errorColor.a + c.rgb * (1.0 - errorColor.a);
            } 
          } 
        }

        c = Ca.rgb * Ca.a + c.rgb * (1.0 - Ca.a);  // blending equation
      }

      // Draw the border with rounded corners
      float sdf = borderSDF(vUv, vec2(0.94 - borderRadius), 0.02, borderRadius);
      c = mix(c, borderColor.rgb, sdf * borderColor.a);

      // Draw the cell number
      // A coord of -1, -1 means do not paint
      if (vCellNumberPosition.x >= 0.0 && vCellNumberPosition.y >= 0.0) {
        // 17.0 is the number of items per line on the texture map
        vec2 position = vec2(vCellNumberPosition.x/17.0, -(vCellNumberPosition.y/17.0 + 1.0/17.0));
        vec2 size = vec2(1.0 / 17.0, 1.0 / 17.0);

        // Adjust UV coordinates to map the texture to the upper-left corner
        vec2 scaledUV = vUv * 2.5 - vec2(0.2, 1.3); // Scale UV and shift to upper-left
        vec2 offset = vec2(0.0, 0.0); // No additional offset needed for upper-left
        vec2 coord = position + size * (scaledUV + offset);

        // // Clamp the coordinates to prevent wrapping
        // coord = clamp(coord, position, position + size);

        // Check if the UV coordinates are within the [0, 1] bounds to avoid texture wrapping
        if (scaledUV.x >= 0.0 && scaledUV.x <= 1.0 && scaledUV.y >= 0.0 && scaledUV.y <= 1.0) {
            vec4 Cb = texture2D(numberTexture, coord);

            // Apply color change to the cell number texture
            Cb = applyColorChange(Cb, fontColor);

            if (Cb.a > 0.2) { // gets rid of a nasty white border
              c = Cb.rgb * Cb.a + c.rgb * (1.0 - Cb.a); // blending equation
            }
        }
      }
    } else {
      c = vec3(0.07, 0.07, 0.07) * c.rgb;  // blending equation
    }
    
    csm_DiffuseColor = vec4(c, 1.0);
  }
`;

export type SelectClueFn = (
  clue: string | undefined,
  cellNumber?: number,
  selected?: number,
) => void;

export type LetterBoxesProps = {
  puzzle: PuzzleType;
  characterTextureAtlasLookup: AtlasType;
  cellNumberTextureAtlasLookup: AtlasType;
  svgTextureAtlasLookup?: AtlasType;
  svgTextureAtlas?: Texture;
  svgGridSize?: number;
  currentKey?: string | undefined;
  selectedSide: number;
  fontColor: number;
  fontDraftColor: number;
  defaultColor: number;
  selectedColor: number;
  adjacentColor: number;
  errorColor: number;
  borderColor: number;
  correctColor: number;
  keyAndIndexOverride?: [string, number]; // For testing
  isVerticalOrientation: boolean;
  disableOrientation: boolean;
  characterPositionArray: Float32Array;
  cellValidationArray: Int16Array;
  cellDraftModeArray: Int16Array;
  autocheckEnabled: boolean;
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
  onSelectClue?: SelectClueFn;
  onInitialize?: () => void;
  turnLeft: () => void;
  turnRight: () => void;
  setOnNextWord?: (callback: (selected: number) => void) => void;
  setOnPrevWord?: (callback: (selected: number) => void) => void;
  theme?: string;
  isSpinning?: boolean;
};

const tempObject = new Object3D();
const tempColor = new Color();
const uniformDefaults = {
  borderRadius: { value: 0.05 },
  errorWidth: { value: 0.035 },
};

type Uniforms = Record<
  string,
  { value: Texture | Vector4 | number | boolean | undefined }
>;
const materialConfig = {
  baseMaterial: MeshPhysicalMaterial,
  toneMapped: false,
  fog: false,
  vertexShader,
  fragmentShader,
};
const materialMap: Map<CubeSidesEnum, CustomShaderMaterial> = new Map();
const createMaterial = (uniforms: Uniforms, sideEnum: CubeSidesEnum) => {
  let material = materialMap.get(sideEnum);
  if (material != null) {
    // Update uniforms
    Object.keys(uniforms).forEach((key) => {
      if (material != null) {
        if (material.uniforms[key]) {
          material.uniforms[key].value = uniforms[key].value;
        } else {
          material.uniforms[key] = uniforms[key];
        }
      }
    });
    material.uniforms.sideIndex = { value: sideEnum };
    material.uniforms.charactersGridSize = {
      value: 6.0,
    };
    material.needsUpdate = true;
    return material;
  } else {
    material = new CustomShaderMaterial({
      ...materialConfig,
      uniforms: {
        sideIndex: { value: sideEnum },
        charactersGridSize: { value: 6.0 },
        ...uniforms,
      },
    });
    materialMap.set(sideEnum, material);
    return material;
  }
};

// THIS MUTATES THE ARRAY -- BE FOREWARNED
const updateCubeSideDisplay = (
  cubeSideDisplayArray: Int32Array,
  id: number,
  x: number,
) => {
  // Sides three and four are the top and bottom (respectively)
  // 1, 2, 5, 6 are the camera facing sides
  cubeSideDisplayArray[id * 2] =
    CubeSidesEnum.six | (x === 0 ? CubeSidesEnum.one : 0);
};

export const LetterBoxes: React.FC<LetterBoxesProps> = ({
  puzzle,
  svgTextureAtlasLookup,
  svgTextureAtlas,
  svgGridSize,
  characterTextureAtlasLookup,
  cellNumberTextureAtlasLookup,
  isVerticalOrientation = false,
  disableOrientation,
  onVerticalOrientationChange,
  setInstancedMesh,
  selectedSide,
  keyAndIndexOverride,
  currentKey,
  updateCharacterPosition,
  characterPositionArray,
  onLetterInput,
  onSelectClue,
  fontColor,
  fontDraftColor,
  defaultColor,
  selectedColor,
  adjacentColor,
  errorColor,
  borderColor,
  correctColor,
  onInitialize,
  cellValidationArray,
  cellDraftModeArray,
  autoNextEnabled,
  turnLeft,
  turnRight,
  setOnPrevWord,
  setOnNextWord,
  theme,
  isSpinning,
}) => {
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
  const [prevTheme, setPrevTheme] = useState<string>();
  const [prevSelected, setPrevSelected] = useState<InstancedMesh['id']>();
  const [prevSelectedSide, setPrevSelectedSide] =
    useState<LetterBoxesProps['selectedSide']>();

  const convertedFontColor = useMemo(() => hexToVector(fontColor), [fontColor]);
  const convertedFontDraftColor = useMemo(
    () => hexToVector(fontDraftColor),
    [fontDraftColor],
  );
  const convertedErrorColor = useMemo(
    () => hexToVector(errorColor),
    [errorColor],
  );
  const convertedBorderColor = useMemo(
    () => hexToVector(borderColor),
    [borderColor],
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
      borderColor: { value: convertedBorderColor },
      correctColor: { value: convertedCorrectColor },
      ...uniformDefaults,
    }),
    [
      characterTextureAtlas,
      convertedBorderColor,
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
      setInstancedMesh(ref);
    }
  }, [ref, setInstancedMesh]);

  const [width, height, rowLength] = useMemo(() => {
    let { width, height } = puzzle.data[0].dimensions;
    return [width, height, width * puzzle.data.length - puzzle.data.length];
  }, [puzzle.data]);

  const [record, size] = useMemo(() => {
    return [puzzle.record, puzzle.record.solution.length];
  }, [puzzle.record]);

  useEffect(() => {
    if (onSelectClue != null) {
      if (!selected) onSelectClue(undefined);
      const { clues } = record;
      if (isVerticalOrientation === true) {
        onSelectClue(
          clues.down.find((c) => c.number === selectedWordCell)?.clue,
          selectedWordCell,
          selected,
        );
      } else {
        onSelectClue(
          clues.across.find((c) => c.number === selectedWordCell)?.clue,
          selectedWordCell,
          selected,
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

  useEffect(() => {
    if (ref == null) return;
    ref.geometry.attributes.cellValidation.needsUpdate = true;
  }, [cellValidationArray, ref]);

  useEffect(() => {
    if (ref == null) return;
    ref.geometry.attributes.cellDraftMode.needsUpdate = true;
  }, [cellDraftModeArray, ref]);

  useEffect(() => {
    if (ref == null) return;
    ref.geometry.attributes.characterPosition.needsUpdate = true;
  }, [characterPositionArray, ref]);

  const cellColorsArray = useMemo(
    () =>
      Float32Array.from(
        new Array(size * 3)
          .fill(0)
          .flatMap(() => tempColor.set(defaultColor).toArray()),
      ),
    [defaultColor, size],
  );

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
    ref,
  );

  const showScaleAnimation = useScaleAnimation(ref);

  // Initial setup (orient the instanced boxes)
  useEffect(
    () => {
      if (ref == null) return;

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
            setSelected(j);
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

        // Hide blank cells
        if (cell === '#') {
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
      // setInitialRotations(rotations);
      // showIntroAnimation(true);
      if (onInitialize) {
        onInitialize();
      }
      showRippleAnimation();
    },
    // Only run once on load
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ref],
  );

  // Need to rerender the letters if the character position changes 👆🏻
  useEffect(() => {
    if (ref == null) return;
    ref.geometry.attributes.characterPosition.needsUpdate = true;
  }, [characterPositionArray, ref]);

  // This does all of the selection logic. Row/cell highlighting, etc.
  useFrame((state) => {
    if (ref == null) return;
    for (let id = 0; id < record.solution.length; id++) {
      // We want to show the next sides as the cube is animating
      const { x } = record.solution[id];
      if (
        isSpinning === true ||
        cellBelongsOnSide(id, selectedSide) ||
        cellBelongsOnSide(id, prevSelectedSide)
      ) {
        updateCubeSideDisplay(cubeSideDisplayArray, id, x);
      } else {
        // Zero means don't show a cube face
        cubeSideDisplayArray[id * 2] = 0;
      }
      ref.geometry.attributes.cubeSideDisplay.needsUpdate = true;

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
        setSelectedWordCell(undefined);
        setPrevTheme(theme);

        (id === hovered || id === selected
          ? tempColor.set(selectedColor)
          : tempColor.set(defaultColor)
        ).toArray(cellColorsArray, id * 3);

        if (selected != null && isVisibleSide(selected) === true) {
          const { solution, wordSequences } = record;
          const cell = solution[selected];

          if (cell?.mapping != null) {
            const sequenceIndex = isVerticalOrientation
              ? cell?.mapping[selectedSide].downSequenceIndex
              : cell?.mapping[selectedSide].acrossSequenceIndex;

            if (sequenceIndex != null) {
              const range = wordSequences[sequenceIndex];
              // Select the clue. It will always be the first cell in the sequence
              const rootWord = solution[range[0]];
              if (
                isCellWithNumber(rootWord.value) &&
                typeof rootWord.value.cell === 'number'
              ) {
                setSelectedWordCell(rootWord.value.cell);
              }
              range.forEach((index) => {
                if (index === selected) return;
                tempColor
                  .set(adjacentColor)
                  .toArray(cellColorsArray, index * 3);
              });
            }
          }
        }

        ref.geometry.attributes.cellColor.needsUpdate = true;
      }
    }
  });

  const goToNextWord = useCallback(
    (selected: number) => {
      const { solution, wordSequencesBySide } = record;
      const cell = solution[selected];

      if (cell?.mapping == null) {
        return;
      }

      const direction: SequenceKeys = isVerticalOrientation ? 'down' : 'across';
      const sequenceIndex = isVerticalOrientation
        ? cell?.mapping[selectedSide]?.downSequenceIndex
        : cell?.mapping[selectedSide]?.acrossSequenceIndex;

      // Update letter and move to the next word
      const keys = Object.keys(wordSequencesBySide[selectedSide][direction]);
      const currentIndex = keys.findIndex(
        (i) => sequenceIndex === parseInt(i, 10),
      );
      const nextIndex = keys[currentIndex + 1];

      // TODO: Instead of worrying about the last cell, can you just look for the next cell even if it's on the next side?
      // Then you can have one logic path

      if (nextIndex != null) {
        const nextRange =
          wordSequencesBySide[selectedSide][direction][parseInt(nextIndex, 10)];
        if (nextRange != null) {
          setSelected(nextRange[0]);
        }
      } else {
        // Move to the next side!
        const nextSide = constrain(0, puzzle.data.length - 1, selectedSide + 1);
        let range = null;
        if (disableOrientation === true) {
          // in this case it's a crossmoji
          // Pick the first blank cell otherwise pick the first cell
          range = wordSequencesBySide[nextSide][direction].find((i) => {
            if (i == null) return false;
            return (
              characterPositionArray[i[0] * 2] === -1 &&
              characterPositionArray[i[0] * 2 + 1] === -1
            );
          });
          range =
            range ??
            wordSequencesBySide[nextSide][direction].find((i) => i != null);
        } else {
          range = wordSequencesBySide[nextSide][direction].find((i) => {
            if (i == null) return false;
            return !isVerticalOrientation || solution[i[0]].x !== 0;
          });
        }

        if (range != null) {
          setSelected(range[0]);
          turnRight();
        }
      }
    },
    [
      record,
      isVerticalOrientation,
      selectedSide,
      puzzle.data.length,
      disableOrientation,
      characterPositionArray,
      turnRight,
    ],
  );

  const goToPreviousWord = useCallback(
    (selected: number, startFromBeginning: boolean = false) => {
      const { solution, wordSequencesBySide } = record;
      const cell = solution[selected];

      if (cell?.mapping == null) {
        return;
      }

      const direction: SequenceKeys = isVerticalOrientation ? 'down' : 'across';
      const sequenceIndex = isVerticalOrientation
        ? cell?.mapping[selectedSide]?.downSequenceIndex
        : cell?.mapping[selectedSide]?.acrossSequenceIndex;

      // Update letter and move to the next word
      const keys = Object.keys(wordSequencesBySide[selectedSide][direction]);
      const currentIndex = keys.findIndex(
        (i) => sequenceIndex === parseInt(i, 10),
      );
      const nextIndex = keys[currentIndex - 1];
      if (nextIndex != null) {
        const nextRange =
          wordSequencesBySide[selectedSide][direction][parseInt(nextIndex, 10)];
        if (nextRange != null) {
          setSelected(nextRange[startFromBeginning ? 0 : nextRange.length - 1]);
        }
      } else {
        // Move to the previous side!
        const nextSide = constrain(0, puzzle.data.length - 1, selectedSide - 1);
        let range = null;
        // in this case it's a crossmoji
        if (disableOrientation === true) {
          // Pick the first blank cell otherwise pick the first cell
          range = wordSequencesBySide[nextSide][direction].findLast((i) => {
            if (i == null) return false;
            return (
              characterPositionArray[i[0] * 2] === -1 &&
              characterPositionArray[i[0] * 2 + 1] === -1
            );
          });
          range =
            range ??
            wordSequencesBySide[nextSide][direction].findLast((i) => i != null);
        } else {
          range = wordSequencesBySide[nextSide][direction].findLast((i) => {
            if (i == null) return false;
            return !isVerticalOrientation || solution[i[0]].x !== 0;
          });
        }
        if (range != null) {
          setSelected(range[startFromBeginning ? 0 : range.length - 1]);
          turnLeft();
        }
      }
    },
    [
      characterPositionArray,
      disableOrientation,
      isVerticalOrientation,
      puzzle.data.length,
      record,
      selectedSide,
      turnLeft,
    ],
  );

  useEffect(() => {
    if (setOnNextWord) {
      setOnNextWord(goToNextWord);
    }
  }, [goToNextWord, setOnNextWord]);

  useEffect(() => {
    if (setOnPrevWord) {
      setOnPrevWord(goToPreviousWord);
    }
  }, [goToPreviousWord, setOnPrevWord]);

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
        ref != null &&
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
                setSelected(nextCell);
              } else if (autoNextEnabled === true) {
                goToNextWord(selectedIndex);
              }
            } else {
              // Delete letter and move to the previous cell
              // Are we on the first letter in the sequence?
              if (sIndex > 0) {
                // Update letter and move to the previous cell
                const nextCell = range[sIndex - 1];
                setSelected(nextCell);
              } else if (autoNextEnabled === true) {
                goToPreviousWord(selectedIndex);
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
      ref,
      updateCharacterPosition,
      record,
      showScaleAnimation,
      isVerticalOrientation,
      selectedSide,
      autoNextEnabled,
      goToNextWord,
      goToPreviousWord,
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

  // Material setup
  const side0 = useMemo(
    () => createMaterial(uniforms, CubeSidesEnum.one),
    [uniforms],
  );
  const side1 = useMemo(
    () => createMaterial(uniforms, CubeSidesEnum.two),
    [uniforms],
  );
  const side2 = useMemo(
    () => createMaterial(uniforms, CubeSidesEnum.three),
    [uniforms],
  );
  const side3 = useMemo(
    () => createMaterial(uniforms, CubeSidesEnum.four),
    [uniforms],
  );
  const side4 = useMemo(
    () => createMaterial(uniforms, CubeSidesEnum.five),
    [uniforms],
  );
  const side5 = useMemo(
    () => createMaterial(uniforms, CubeSidesEnum.six),
    [uniforms],
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
      <roundedBoxGeometry args={[1.05, 1.05, 1.05, 2, 0.08]}>
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
      </roundedBoxGeometry>
    </instancedMesh>
  );
};

export default LetterBoxes;
