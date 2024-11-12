import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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
import useDimensions from 'react-cool-dimensions';
import { fitCameraToCenteredObject } from 'lib/utils/three';
import { useSpring } from '@react-spring/core';
import { easings } from '@react-spring/web';
import { rangeOperation } from 'lib/utils/math';

function Loader() {
  return (
    <Html center>
      <Spinner show />
    </Html>
  );
}

const mousePosition = [100, 3];

interface PuzzleCanvasProps
  extends Omit<
    LetterBoxesProps,
    'turnLeft' | 'turnRight' | 'isSpinning' | 'selectedSide'
  > {
  isInitialized: boolean;
  isPuzzleSolved: boolean;
  sparkColors: string[];
  onSelectedSideChange?: (side: number) => void;
  onSideOffsetChange?: (offset: number) => void;
  shouldTurn?: 'left' | 'right' | null;
  onTurnReset?: () => void;
}

function PuzzleCanvas({
  isInitialized,
  puzzle,
  svgTextureAtlas,
  svgTextureAtlasLookup,
  svgGridSize,
  characterTextureAtlasLookup,
  cellNumberTextureAtlasLookup,
  selected,
  onSelectedChange,
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
  isSingleSided,
  isPuzzleSolved,
  sparkColors,
  onSelectedSideChange,
  onSideOffsetChange,
  shouldTurn,
  onTurnReset,
}: PuzzleCanvasProps) {
  const [puzzleWidth] = useMemo(() => {
    if (puzzle == null || puzzle.data.length < 1) {
      return [8]; // default to 8
    }
    const { width, height } = puzzle.data[0].dimensions;
    const totalPerSide = width * height;
    return [width, height, totalPerSide];
  }, [puzzle]);

  const groupPosition: Vector3 = useMemo(() => {
    const multiplier = (puzzleWidth - 1) / 2;
    return new Vector3(-multiplier, -multiplier, multiplier);
  }, [puzzleWidth]);

  const {
    observe: canvasRef,
    height: canvasHeight,
    width: canvasWidth,
  } = useDimensions<HTMLCanvasElement>();

  const [groupRef, setGroup] = useState<Object3D | null>();
  const [cameraRef, setCameraRef] = useState<PerspectiveCameraType | null>();

  const [fogNear, setFogNear] = useState(0);
  const [fogFar, setFogFar] = useState(100);
  const [objectDepth, setObjectDepth] = useState(0);

  useEffect(() => {
    if (cameraRef == null || groupRef == null || isInitialized === false) {
      return undefined;
    }

    const { boundingBox, cameraZ } = fitCameraToCenteredObject(
      cameraRef,
      groupRef,
      new Vector3(puzzleWidth, puzzleWidth, puzzleWidth),
      1.02,
    );

    const objectDepth = boundingBox.max.z - boundingBox.min.z;
    const fogNearDistance = (cameraZ - objectDepth / 2) * 1.02;
    const fogFarDistance = (cameraZ + objectDepth / 2) * 1.02;

    setObjectDepth(objectDepth);
    setFogNear(fogNearDistance);
    setFogFar(fogFarDistance);
  }, [
    cameraRef,
    groupRef,
    puzzleWidth,
    canvasHeight,
    canvasWidth,
    isInitialized,
  ]);

  const animationStarted = useRef(false);
  // Intro spinny animation
  const [rotation, setRotation] = useState(0);
  const { rotation: introAnimation } = useSpring({
    rotation: 1,
    config: {
      duration: 500,
      easing: easings.easeInBack,
    },
  });
  useEffect(() => {
    if (canvasWidth != null && animationStarted.current === false) {
      animationStarted.current = true;
      introAnimation.start({
        from: 0,
        to: 1,
        onChange: (props, spring) => {
          setRotation(spring.get());
        },
      });
    }
  }, [canvasWidth, introAnimation]);

  const [selectedSide, setSelectedSide] = useState(0);

  const [, api] = useSpring(() => ({
    singleSidedOffset: 0,
  }));
  const turnAnimationPlaying = useRef(false);
  const [sideOffset, setSideOffset] = useState(0);
  const updateSideOffset = useCallback(
    (offset: number) => {
      setSideOffset(offset);
      onSideOffsetChange?.(offset);

      // Update side
      const side = rangeOperation(0, 3, 0, -offset);
      onSelectedSideChange?.(side);
      setSelectedSide(side);
    },
    [onSideOffsetChange, onSelectedSideChange],
  );

  const animateCannotTurn = useCallback(
    (offset: number) => {
      if (turnAnimationPlaying.current === true) return;
      api.start({
        config: {
          duration: 30,
        },
        from: { singleSidedOffset: sideOffset },
        to: [
          { singleSidedOffset: sideOffset + offset },
          { singleSidedOffset: sideOffset },
        ],
        onResolve: ({ finished }) => {
          if (finished === true) {
            turnAnimationPlaying.current = false;
          }
        },
        onChange: (_, spring) => {
          turnAnimationPlaying.current = true;
          updateSideOffset(spring.get().singleSidedOffset);
        },
      });
    },
    [api, onTurnReset, updateSideOffset],
  );

  const onSwipeLeft = useCallback(
    (offset?: number) => {
      if (isSingleSided === true) {
        animateCannotTurn(0.2);
      } else {
        updateSideOffset(sideOffset + (offset ?? 1));
      }
    },
    [api, isSingleSided, sideOffset, updateSideOffset, animateCannotTurn],
  );

  const onSwipeRight = useCallback(
    (offset?: number) => {
      if (isSingleSided === true) {
        animateCannotTurn(-0.2);
      } else {
        updateSideOffset(sideOffset - (offset ?? 1));
      }
    },
    [api, isSingleSided, sideOffset, updateSideOffset, animateCannotTurn],
  );

  // Track rotation so we can update the shader in letterboxes
  const [isSpinning, setIsSpinning] = useState(false);
  const onRotationProgress = useCallback((progress: number) => {
    // So, this is kind of weird
    // We only want isSpinning to be true in a more limited range because we want to hide the
    // side faces when the animation is mostly complete (not fully) to prevent flickering
    setIsSpinning(progress <= 0.98);
  }, []);

  useEffect(() => {
    if (shouldTurn === 'left') {
      onSwipeLeft();
      onTurnReset?.();
    } else if (shouldTurn === 'right') {
      onSwipeRight();
      onTurnReset?.();
    }
  }, [shouldTurn, onTurnReset, onSwipeLeft, onSwipeRight]);

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
          ref={setCameraRef}
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
          <group ref={setGroup} position={groupPosition}>
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
          mouse={mousePosition}
          radius={objectDepth / 2}
          colors={sparkColors}
        />
      </Suspense>
    </Canvas>
  );
}

export default PuzzleCanvas;
