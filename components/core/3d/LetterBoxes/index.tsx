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
  Object3D,
  Color,
  Euler,
  Texture,
  Vector4,
  PointLight,
  MeshBasicMaterial,
  DoubleSide,
  MeshPhongMaterial,
} from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import { InstancedMesh } from 'three';
import { rotateAroundPoint } from '../../../../lib/utils/three';
import { SequenceKeys, isCellWithNumber } from '../../../../lib/utils/puzzle';
import { useScaleRippleAnimation } from '../../../../lib/utils/hooks/animations/useScaleRippleAnimation';
import { PuzzleType } from 'types/types';
import { useScaleAnimation } from 'lib/utils/hooks/animations/useScaleAnimation';
import { hexToVector } from 'lib/utils/color';
import { constrain } from 'lib/utils/math';
import { RoundedBoxGeometry } from 'components/three/RoundedBoxGeometry';
import { AtlasType } from 'lib/utils/atlas';
import { useMatcapTexture } from '@react-three/drei';
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

  void main(void)
  {
    vec4 finalColor = vec4(0.0, 0.0, 0.0, 0.0);
    
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
            finalColor = correctColor;
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
              finalColor = errorColor;
            } 
          } 
        }

        if (Ca.a > 0.4) { // gets rid of a nasty white border
          finalColor = Ca; 
        }
      }

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

        // Check if the UV coordinates are within the [0, 1] bounds to avoid texture wrapping
        if (scaledUV.x >= 0.0 && scaledUV.x <= 1.0 && scaledUV.y >= 0.0 && scaledUV.y <= 1.0) {
            vec4 Cb = texture2D(numberTexture, coord);

            // Apply color change to the cell number texture
            Cb = applyColorChange(Cb, fontColor);

            if (Cb.a > 0.2) { // gets rid of a nasty white border
              finalColor = Cb; // blending equation
            }
        }
      }
    }
    
    csm_DiffuseColor = finalColor;
  }
`;

const vertexPhongShader = `
  attribute vec3 cellColor;

  varying vec2 vMatcapUV;
  varying vec3 vCellColor;

  void main() {
    vCellColor = cellColor;
    
    vec4 pos = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    
    gl_Position = projectionMatrix * pos;

    vec3 normalWorld = normalize(mat3(modelViewMatrix * instanceMatrix) * normal);
    vec3 viewDir = normalize(pos.xyz);
    vec3 x = normalize(vec3(viewDir.z, 0.0, -viewDir.x));
    vec3 y = cross(viewDir, x);
    vMatcapUV = vec2(dot(x, normalWorld), dot(y, normalWorld)) * 0.495 + 0.5;
  }
`;

const fragmentPhongShader = `
  #ifdef GL_ES
  precision highp float;
  #endif

  uniform sampler2D matcapTexture;
  varying vec2 vMatcapUV;
  varying vec3 vCellColor;  

  void main(void) {
    vec4 matcapColor = texture2D(matcapTexture, vMatcapUV);
    csm_DiffuseColor = vec4(matcapColor.rgb, csm_DiffuseColor.a);
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
  blankColor: number;
  selectedColor: number;
  adjacentColor: number;
  errorColor: number;
  borderColor: number;
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
  onSelectClue?: SelectClueFn;
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

const tempObject = new Object3D();
const tempColor = new Color();
const uniformDefaults = {
  borderRadius: { value: 0.05 },
  errorWidth: { value: 0.035 },
};

type Uniforms = Record<
  string,
  { value: Texture | Vector4 | number | boolean | undefined | Vector3 }
>;
const basicMaterialMap: Map<CubeSidesEnum, CustomShaderMaterial> = new Map();
const createBasicMaterial = (uniforms: Uniforms, sideEnum: CubeSidesEnum) => {
  let material = basicMaterialMap.get(sideEnum);
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
      baseMaterial: MeshBasicMaterial,
      toneMapped: false,
      fog: false,
      vertexShader,
      fragmentShader,
      uniforms: {
        sideIndex: { value: sideEnum },
        charactersGridSize: { value: 6.0 },
        ...uniforms,
      },
      side: DoubleSide,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -4,
    });
    basicMaterialMap.set(sideEnum, material);
    return material;
  }
};

const cellsMaterialMap: Map<CubeSidesEnum, CustomShaderMaterial> = new Map();
const createCellsMaterial = (uniforms: Uniforms, sideEnum: CubeSidesEnum) => {
  let material = cellsMaterialMap.get(sideEnum);
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
    material.needsUpdate = true;
    return material;
  } else {
    material = new CustomShaderMaterial({
      baseMaterial: MeshPhongMaterial,
      fog: true,
      uniforms: {
        ...uniforms,
      },
      vertexShader: vertexPhongShader,
      fragmentShader: fragmentPhongShader,
      color: new Color(0xff0000),
      specular: new Color(0x111111),
      shininess: 100,
    });
    cellsMaterialMap.set(sideEnum, material);
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
  blankColor,
  selectedColor,
  adjacentColor,
  errorColor,
  borderColor,
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
  isSpinning,
  isSingleSided,
}) => {
  const [cellPositions, setCellPositions] = useState<Record<number, Vector3>>(
    {},
  );
  const lightRef = useRef<PointLight>(null);

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
    cellsDisplayRef,
  );

  const showScaleAnimation = useScaleAnimation(cellsDisplayRef);

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

        if (cell === '#') {
          if (
            isSingleSided === true &&
            Math.floor((j % rowLength) / width) !== 0 // first side including last column
          ) {
            tempObject.scale.set(0, 0, 0);
          } else {
            tempColor.set(blankColor).toArray(cellColorsArray, j * 3);
          }
        }

        tempObject.updateMatrix();
        cellsDisplayRef.setMatrixAt(j, tempObject.matrix);
        cellsRef.setMatrixAt(j, tempObject.matrix);
        rotations[j] = new Euler().copy(tempObject.rotation);
        positions[j] = new Vector3().copy(tempObject.position);
      }

      setCellPositions(positions);

      cellsDisplayRef.geometry.attributes.characterPosition.needsUpdate = true;
      cellsDisplayRef.geometry.attributes.cellNumberPosition.needsUpdate = true;
      cellsDisplayRef.geometry.attributes.cubeSideDisplay.needsUpdate = true;
      cellsDisplayRef.instanceMatrix.needsUpdate = true;

      cellsRef.geometry.attributes.cellColor.needsUpdate = true;
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

  // Need to rerender the letters if the character position changes 👆🏻
  useEffect(() => {
    if (cellsDisplayRef == null) return;
    cellsDisplayRef.geometry.attributes.characterPosition.needsUpdate = true;
  }, [characterPositionArray, cellsDisplayRef]);

  // This does all of the selection logic. Row/cell highlighting, etc.
  useFrame((state) => {
    if (cellsDisplayRef == null || cellsRef == null) return;
    for (let id = 0; id < record.solution.length; id++) {
      // We want to show the next sides as the cube is animating
      const { x } = record.solution[id];
      if (
        isSingleSided === true ||
        isSpinning === true ||
        cellBelongsOnSide(id, selectedSide) ||
        cellBelongsOnSide(id, prevSelectedSide)
      ) {
        updateCubeSideDisplay(cubeSideDisplayArray, id, x);
      } else {
        // Zero means don't show a cube face
        cubeSideDisplayArray[id * 2] = 0;
      }
      cellsDisplayRef.geometry.attributes.cubeSideDisplay.needsUpdate = true;

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

        const { solution } = record;
        const cell = solution[id];

        if (cell.value !== '#') {
          (id === hovered || id === selected
            ? tempColor.set(selectedColor)
            : tempColor.set(defaultColor)
          ).toArray(cellColorsArray, id * 3);
        }

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

        cellsRef.geometry.attributes.cellColor.needsUpdate = true;
      }
    }

    if (lightRef.current && selected !== undefined && cellPositions[selected]) {
      lightRef.current.position.copy(cellPositions[selected]);
    }
  });

  const goToNextWord = useCallback(
    (selected: number, polarity: 1 | -1 = 1) => {
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

      setSelected(nextSelected);
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
      record,
      isSingleSided,
      isVerticalOrientation,
      selectedSide,
      selectNextBlankEnabled,
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
                setSelected(nextCell);
              } else if (autoNextEnabled === true) {
                goToNextWord(selectedIndex, 1);
              }
            } else {
              // Delete letter and move to the previous cell
              // Are we on the first letter in the sequence?
              if (sIndex > 0) {
                // Update letter and move to the previous cell
                const nextCell = range[sIndex - 1];
                setSelected(nextCell);
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

  const [matcapTexture] = useMatcapTexture(
    55, // index of the matcap texture https://github.com/emmelleppi/matcaps/blob/master/matcap-list.json
    64, // size of the texture ( 64, 128, 256, 512, 1024 )
  );

  const cellsUniforms: Uniforms = useMemo(
    () => ({
      matcapTexture: { value: matcapTexture },
    }),
    [matcapTexture],
  );

  // Set up materials for the interactive cells
  const cellsSide0 = useMemo(
    () => createCellsMaterial(cellsUniforms, CubeSidesEnum.one),
    [cellsUniforms],
  );
  const cellsSide1 = useMemo(
    () => createCellsMaterial(cellsUniforms, CubeSidesEnum.two),
    [cellsUniforms],
  );
  const cellsSide2 = useMemo(
    () => createCellsMaterial(cellsUniforms, CubeSidesEnum.three),
    [cellsUniforms],
  );
  const cellsSide3 = useMemo(
    () => createCellsMaterial(cellsUniforms, CubeSidesEnum.four),
    [cellsUniforms],
  );
  const cellsSide4 = useMemo(
    () => createCellsMaterial(cellsUniforms, CubeSidesEnum.five),
    [cellsUniforms],
  );
  const cellsSide5 = useMemo(
    () => createCellsMaterial(cellsUniforms, CubeSidesEnum.six),
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
    <>
      <instancedMesh
        ref={setCellsDisplayRef}
        args={[undefined, undefined, size]}
        renderOrder={1}
        material={[side0, side1, side2, side3, side4, side5]}
      >
        <boxGeometry args={[0.92, 0.92, 0.92]}>
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
        </boxGeometry>
      </instancedMesh>
      <instancedMesh
        ref={setCellsRef}
        args={[undefined, undefined, size]}
        onPointerMove={onPointerMove}
        onPointerOut={onPointerOut}
        onPointerDown={onPointerDown}
        renderOrder={0}
        material={[
          cellsSide0,
          cellsSide1,
          cellsSide2,
          cellsSide3,
          cellsSide4,
          cellsSide5,
        ]}
      >
        <roundedBoxGeometry args={[0.92, 0.92, 0.92, 2, 0.08]}>
          <instancedBufferAttribute
            attach="attributes-cellColor"
            count={cellColorsArray.length}
            itemSize={3}
            array={cellColorsArray}
          />
        </roundedBoxGeometry>
      </instancedMesh>
      <pointLight ref={lightRef} intensity={10} color={selectedColor} />
    </>
  );
};

export default LetterBoxes;
