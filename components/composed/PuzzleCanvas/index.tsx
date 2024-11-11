import React, { Suspense, useRef } from 'react';

import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Html } from '@react-three/drei';
import { Spinner } from 'components/core/ui/spinner';

import {
  PerspectiveCamera as PerspectiveCameraType,
  Color,
  Object3D,
  Vector3,
} from 'three';
import { SwipeControls } from 'components/core/3d/SwipeControls';
import LetterBoxes, { LetterBoxesProps } from 'components/core/3d/LetterBoxes';
import Sparks from 'components/core/3d/Sparks';

function Loader() {
  return (
    <Html center>
      <Spinner show />
    </Html>
  );
}

interface PuzzleCanvasProps
  extends Omit<LetterBoxesProps, 'turnLeft' | 'turnRight'> {
  fogNear: number;
  fogFar: number;
  objectDepth: number;
  rotation: number;
  sideOffset: number;
  groupPosition: Vector3;
  isPuzzleSolved: boolean;
  sparkColors: string[];
  canvasRef: (element?: HTMLCanvasElement | null) => void;
  cameraRef: (element?: PerspectiveCameraType | null) => void;
  groupRef: (element?: Object3D | null) => void;
  onRotationProgress: (progress: number) => void;
  onSwipeLeft: (offset?: number) => void;
  onSwipeRight: (offset?: number) => void;
}

function PuzzleCanvas({
  canvasRef,
  cameraRef,
  groupRef,
  fogNear,
  fogFar,
  objectDepth,
  rotation,
  sideOffset,
  onRotationProgress,
  onSwipeLeft,
  onSwipeRight,
  groupPosition,
  puzzle,
  svgTextureAtlas,
  svgTextureAtlasLookup,
  svgGridSize,
  characterTextureAtlasLookup,
  cellNumberTextureAtlasLookup,
  selected,
  onSelectedChange,
  selectedSide,
  keyAndIndexOverride,
  currentKey,
  updateCharacterPosition,
  onLetterInput,
  fontColor,
  fontDraftColor,
  selectedColor,
  errorColor,
  correctColor,
  onInitialize,
  isVerticalOrientation,
  onVerticalOrientationChange,
  autoCheckEnabled,
  selectNextBlankEnabled,
  characterPositionArray,
  cellValidationArray,
  cellDraftModeArray,
  autoNextEnabled,
  setGoToNextWord,
  theme,
  isSpinning,
  isSingleSided,
  isPuzzleSolved,
  sparkColors,
}: PuzzleCanvasProps) {
  const mouse = useRef([100, 3]);

  return (
    <Canvas
      gl={{ antialias: false }}
      style={{
        touchAction: 'none',
      }}
      ref={canvasRef}
    >
      <Suspense fallback={<Loader />}>
        <fog
          attach="fog"
          color={new Color(0x222222)}
          near={fogNear}
          far={fogFar}
        />
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={[0, 0, 0]}
          fov={50}
        />
        <ambientLight intensity={1} />
        <SwipeControls
          global
          dragEnabled={false}
          onSwipeLeft={onSwipeLeft}
          onSwipeRight={onSwipeRight}
          rotation={[0, rotation * (Math.PI + Math.PI * (sideOffset / 2)), 0]}
          onRotationYProgress={onRotationProgress}
        >
          <group ref={groupRef} position={groupPosition}>
            <LetterBoxes
              puzzle={puzzle}
              svgTextureAtlas={svgTextureAtlas}
              svgTextureAtlasLookup={svgTextureAtlasLookup}
              svgGridSize={svgGridSize}
              characterTextureAtlasLookup={characterTextureAtlasLookup}
              cellNumberTextureAtlasLookup={cellNumberTextureAtlasLookup}
              selected={selected}
              onSelectedChange={onSelectedChange}
              selectedSide={selectedSide}
              keyAndIndexOverride={keyAndIndexOverride}
              currentKey={currentKey}
              updateCharacterPosition={updateCharacterPosition}
              onLetterInput={onLetterInput}
              fontColor={fontColor}
              fontDraftColor={fontDraftColor}
              selectedColor={selectedColor}
              errorColor={errorColor}
              correctColor={correctColor}
              onInitialize={onInitialize}
              isVerticalOrientation={isVerticalOrientation}
              onVerticalOrientationChange={onVerticalOrientationChange}
              autoCheckEnabled={autoCheckEnabled}
              selectNextBlankEnabled={selectNextBlankEnabled}
              characterPositionArray={characterPositionArray}
              cellValidationArray={cellValidationArray}
              cellDraftModeArray={cellDraftModeArray}
              autoNextEnabled={autoNextEnabled}
              turnLeft={onSwipeLeft}
              turnRight={onSwipeRight}
              setGoToNextWord={setGoToNextWord}
              theme={theme}
              isSpinning={isSpinning}
              isSingleSided={isSingleSided}
            />
          </group>
        </SwipeControls>
        <Sparks
          count={isPuzzleSolved === true ? 20 : 0}
          mouse={mouse}
          radius={objectDepth / 2}
          colors={sparkColors}
        />
      </Suspense>
    </Canvas>
  );
}

export default PuzzleCanvas;
