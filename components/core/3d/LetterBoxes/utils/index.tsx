import {
  DoubleSide,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  Texture,
  Vector3,
  Vector4,
} from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

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

export type Uniforms = Record<
  string,
  { value: Texture | Vector4 | number | boolean | undefined | Vector3 }
>;
const basicMaterialMap: Map<CubeSidesEnum, CustomShaderMaterial> = new Map();
export const createBasicMaterial = (
  uniforms: Uniforms,
  sideEnum: CubeSidesEnum,
) => {
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
export const createCellsMaterial = (
  uniforms: Uniforms,
  sideEnum: CubeSidesEnum,
) => {
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
export const updateCubeSideDisplay = (
  cubeSideDisplayArray: Int32Array,
  id: number,
  x: number,
) => {
  // Sides three and four are the top and bottom (respectively)
  // 1, 2, 5, 6 are the camera facing sides
  cubeSideDisplayArray[id * 2] =
    CubeSidesEnum.six | (x === 0 ? CubeSidesEnum.one : 0);
};

export const tempObject = new Object3D();
export const uniformDefaults = {
  borderRadius: { value: BORDER_RADIUS },
  errorWidth: { value: 0.05 },
};
