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
  Euler,
  Texture,
  Vector4,
  MeshBasicMaterial,
  DoubleSide,
  MeshLambertMaterial,
  Mesh,
  Quaternion,
} from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import { InstancedMesh } from 'three';
import { rotateAroundPoint } from '../../../../lib/utils/three';
import {
  SequenceKeys,
  getRangeForCell,
  isCellWithNumber,
} from '../../../../lib/utils/puzzle';
import { useScaleRippleAnimation } from '../../../../lib/utils/hooks/animations/useScaleRippleAnimation';
import { PuzzleType } from 'types/types';
import { useScaleAnimation } from 'lib/utils/hooks/animations/useScaleAnimation';
import { hexToVector } from 'lib/utils/color';
import { constrain } from 'lib/utils/math';
import { RoundedBoxGeometry } from 'components/three/RoundedBoxGeometry';
import { AtlasType } from 'lib/utils/atlas';
import { MeshTransmissionMaterial, useTexture } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import PulsatingLight from '../PulsatingLight';
extend({ RoundedBoxGeometry });

export const BORDER_RADIUS = 0.08;
export const CUBE_SIZE: [number, number, number] = [0.92, 0.92, 0.92];
export const ROUNDED_CUBE_SIZE: [number, number, number, number, number] = [
  ...CUBE_SIZE,
  2,
  BORDER_RADIUS,
];

export enum MatcapIndexEnum {
  default = 0,
  adjacent = 1,
  blank = 2,
}

export enum CubeSidesEnum {
  one = 1 << 0,
  two = 1 << 1,
  three = 1 << 2,
  four = 1 << 3,
  five = 1 << 4,
  six = 1 << 5,
}

export enum CellStyleEnum {
  None = 0,
  Circle = 1 << 0,
  LeftBar = 1 << 1,
  RightBar = 1 << 2,
  TopBar = 1 << 3,
  BottomBar = 1 << 4,
}

const vertexShader = `
  attribute float cellStyle;
  attribute vec2 cellValidation;
  attribute vec2 cellDraftMode;
  attribute vec2 characterPosition;
  attribute vec2 cellNumberPosition;
  in ivec2 cubeSideDisplay;
  
  varying vec2 vUv;
  varying vec2 vCellValidation;
  varying vec2 vCellDraftMode;
  varying vec2 vCharacterPosition;
  varying vec2 vCellNumberPosition;
  flat out ivec2 vCubeSideDisplay;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying float vCellStyle;

  void main()
  {
      vUv = uv;
      vCellValidation = cellValidation;
      vCellDraftMode = cellDraftMode;
      vCharacterPosition = characterPosition;
      vCellNumberPosition = cellNumberPosition;
      vCubeSideDisplay = cubeSideDisplay;
      vCellStyle = cellStyle;

      vWorldNormal = normalize(mat3(modelViewMatrix * instanceMatrix) * normal);
      vWorldPosition = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;
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
  uniform float errorWidth;
  uniform vec4 errorColor;
  uniform vec4 correctColor;
  uniform vec4 fontColor;
  uniform vec4 fontDraftColor;
  
  // Add a new uniform for the shrink factor
  uniform float shrinkFactor;

  varying vec2 vUv;
  varying vec2 vCellValidation;
  varying vec2 vCellDraftMode;
  varying vec2 vCharacterPosition;
  varying vec2 vCellNumberPosition;
  varying float vFaceVisibility;
  flat varying ivec2 vCubeSideDisplay;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  
  varying float vCellStyle;

  vec4 applyColorChange(vec4 color, vec4 newColor) {
    return vec4(newColor.rgb, color.a); // Change white to the target color
  }

  float roundedRectangle(vec2 uv, vec2 size, float radius) {
    vec2 q = abs(uv) - (size - 0.01) + radius;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
  }

  void main(void)
  {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float dotProduct = dot(normalize(vWorldNormal), viewDir);

    // Discard fragment if face is not visible (close to 90 degrees from view)
    if (abs(dotProduct) < 0.5) {
      discard;
    }

    // Adjust UV coordinates to shrink the entire face
    vec2 centeredUV = vUv - 0.5;
    vec2 shrunkUV = centeredUV / shrinkFactor;
    vec2 adjustedUV = shrunkUV + 0.5;

    // Discard fragments outside the shrunk area
    if (any(lessThan(adjustedUV, vec2(0.0))) || any(greaterThan(adjustedUV, vec2(1.0)))) {
      discard;
    }

    // Discard fragments outside the rounded rectangle
    float dist = roundedRectangle(adjustedUV - 0.5, vec2(0.5), borderRadius);
    if (dist > 0.0) {
      discard;
    }

    vec4 finalColor = vec4(0.0, 0.0, 0.0, 0.0);
    bool isDrawingCellNumber = false;

    // Bitflag 1 is the circle
    bool shouldDrawCircle = (uint(vCellStyle) & 1u) == 1u;
    
    // Here we paint all of our textures

    // Show character when bitflag is on for the side
    if ((uint(vCubeSideDisplay.x) & sideIndex) == sideIndex) {

      // Draw the cell number
      // A coord of -1, -1 means do not paint
      if (vCellNumberPosition.x >= 0.0 && vCellNumberPosition.y >= 0.0) {
        // 17.0 is the number of items per line on the texture map
        vec2 position = vec2(vCellNumberPosition.x/17.0, -(vCellNumberPosition.y/17.0 + 1.0/17.0));
        vec2 size = vec2(1.0 / 17.0, 1.0 / 17.0);

        // Adjust UV coordinates to map the texture to the upper-left corner
        vec2 scaledUV = adjustedUV * 2.5 - vec2(0.2, 1.3); // Scale UV and shift to upper-left
        vec2 coord = position + size * scaledUV;

        // Check if we are drawing the circle and remove the cell number background from it
        if (shouldDrawCircle && scaledUV.x >= -0.1 && scaledUV.x <= 1.0 && scaledUV.y >= 0.45 && scaledUV.y <= 1.05) {
          // Check for colored pixels near transparent ones
          bool hasColoredPixel = false;
          bool hasTransparentPixel = false;

          // This searches for a colored pixel near a transparent one and tells us not to draw
          // anything behind it (creates a transparent border around the cell number)
          for (float dx = -1.75; dx <= 1.75; dx += 1.0) {
            for (float dy = -1.75; dy <= 1.75; dy += 1.0) {
              vec2 sampleCoord = coord + vec2(dx, dy) / 17.0 / 17.0;
              vec4 sampleColor = texture2D(numberTexture, sampleCoord);
              
              if (sampleColor.a > 0.1) {
                hasColoredPixel = true;
              } else {
                hasTransparentPixel = true;
              }
              
              if (hasColoredPixel && hasTransparentPixel) {
                isDrawingCellNumber = true;
                hasColoredPixel = false;
                hasTransparentPixel = false;
                break;
              }
            }
            if (isDrawingCellNumber) break;
          }
        }

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

      // Check if the Circle style is applied
      // Do not draw it if we are drawing the cell number
      if (shouldDrawCircle && !isDrawingCellNumber) {
        vec2 center = vec2(0.5, 0.5);
        float distanceFromCenter = length(vUv - center);
        float circleRadius = 0.45;
        float circleEdgeWidth = 0.035;
        
        // Smooth step for anti-aliasing
        float smoothEdge = smoothstep(circleRadius - circleEdgeWidth - 0.01, circleRadius - circleEdgeWidth, distanceFromCenter) -
                           smoothstep(circleRadius - 0.01, circleRadius, distanceFromCenter);
        
        vec4 circleColor = vec4(fontColor.rgb, smoothEdge);
        finalColor = mix(finalColor, circleColor, circleColor.a);
      }

      // Draw the letter or emoji
      // A coord of -1, -1 means do not paint
      if (vCharacterPosition.x >= 0.0 && vCharacterPosition.y >= 0.0) {
        vec2 position, size, coord;
        vec4 Ca;
        if (useSvgTexture == true) {
          // CanvasTexture uses a flipped coordinate system
          position = vec2(vCharacterPosition.x/svgGridSize, 1.0 - (vCharacterPosition.y/svgGridSize + 1.0/svgGridSize));
          size = vec2(1.0 / svgGridSize, 1.0 / svgGridSize);
          coord = position + size * fract(adjustedUV);
          Ca = texture2D(svgTexture, coord);
        } else {
          position = vec2(vCharacterPosition.x/charactersGridSize, -(vCharacterPosition.y/charactersGridSize + 1.0/charactersGridSize));
          size = vec2(1.0 / charactersGridSize, 1.0 / charactersGridSize);
          coord = position + size * fract(adjustedUV);
          Ca = texture2D(characterTexture, coord);
          // Apply color change to the texture color
          Ca = applyColorChange(Ca, fontColor);
        }

        if (vCellValidation.x == 2.0) {
          // Draw the mark for a correct letter
          if (vUv.y > (1.0 - vUv.x + 0.65)) {
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
    }
    
    csm_DiffuseColor = finalColor;
  }
`;

const vertexCellShader = `
  attribute float matcapIndex;
  attribute float visibility;

  varying vec2 vMatcapUV;
  varying float vMatcapIndex;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vMatcapIndex = matcapIndex;
    vec4 pos = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    
    // Hide the instance if visibility is 0
    if (visibility < 0.5) {
      csm_Position = vec3(0.0, 0.0, 2.0); // Move off-screen
    }

    vec3 normalWorld = normalize(mat3(modelViewMatrix * instanceMatrix) * normal);
    vec3 viewDir = normalize(pos.xyz);
    vec3 x = normalize(vec3(viewDir.z, 0.0, -viewDir.x));
    vec3 y = cross(viewDir, x);
    vMatcapUV = vec2(dot(x, normalWorld), dot(y, normalWorld)) * 0.495 + 0.5;

    vWorldNormal = normalWorld;
    vWorldPosition = pos.xyz;
  }
`;

const fragmentCellShader = `
  #ifdef GL_ES
  precision highp float;
  #endif

  uniform sampler2D cellTextureAtlas;
  uniform sampler2D blankTextureAtlas;
  uniform vec4 adjacentColor;

  varying vec2 vMatcapUV;
  varying float vMatcapIndex;  

  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main(void) {
    vec4 matcapColor = vec4(0.0, 0.0, 0.0, 0.0);
    if (vMatcapIndex == 0.0 || vMatcapIndex == 1.0) { // cell color
      matcapColor = texture2D(cellTextureAtlas, vMatcapUV);
      // Increase brightness for white or near-white colors
      float luminance = dot(matcapColor.rgb, vec3(0.299, 0.587, 0.114));
      float brightnessFactor = smoothstep(0.65, 1.0, luminance);
      if (vMatcapIndex == 1.) {
        matcapColor.rgb = mix(matcapColor.rgb, adjacentColor.rgb, 0.9);
      }
      matcapColor.rgb = mix(matcapColor.rgb, matcapColor.rgb * 8., brightnessFactor);      

      // Calculate the angle between face normal and view direction
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float dotProduct = dot(normalize(vWorldNormal), viewDir);
      
      // Adjust this value to control the darkening effect
      float darkeningFactor = 0.1;
      
      // Calculate darkening based on the angle
      float darkening = mix(darkeningFactor, 1.0, abs(dotProduct));

      // Apply darkening to the final color
      matcapColor.rgb *= darkening;
    } else if (vMatcapIndex == 2.0) { // blank color
      matcapColor = texture2D(blankTextureAtlas, vMatcapUV);
    }

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

const tempObject = new Object3D();
const uniformDefaults = {
  borderRadius: { value: BORDER_RADIUS },
  errorWidth: { value: 0.05 },
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
      baseMaterial: MeshLambertMaterial,
      uniforms: {
        ...uniforms,
      },
      fog: true,
      vertexShader: vertexCellShader,
      fragmentShader: fragmentCellShader,
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
  // const [isVerticalOrientation, setVerticalOrientation] =
  //   useState<boolean>(false);
  const [prevOrientation, setPrevOrientation] = useState<boolean>(
    isVerticalOrientation,
  );

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
    [cellsDisplayRef, cellsRef],
  );

  const showScaleAnimation = useScaleAnimation([cellsDisplayRef, cellsRef]);

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
      record,
      isVerticalOrientation,
      selectedSide,
      selectNextBlankEnabled,
      onSelectedChange,
      isSingleSided,
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
