import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { getPuzzleById, getPuzzles } from '../../lib/utils/reader';
import styled from '@emotion/styled';
import { Canvas } from '@react-three/fiber';
import { useElementSize } from 'usehooks-ts';
import {
  PresentationControls,
  OrthographicCamera,
  Stats,
} from '@react-three/drei';
import LetterBoxes from '../../components/core/3d/Box';
import { PuzzleData } from '../../types/types';
import {
  generateTextures,
  NUMBER_RECORD,
  TEXTURE_RECORD,
} from '../../lib/utils/textures';
import { useMemo, useState } from 'react';
import { Box3, Camera, Vector3, Mesh } from 'three';
import type {
  OrthographicCamera as OrthographicCameraType,
  InstancedMesh as InstancedMeshType,
} from 'three';

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  touch-action: none;
`;

const RedDot1 = styled.div`
  background-color: red;
  width: 5px;
  height: 5px;
  position: absolute;
  left: 208px;
  top: 187px;
`;
const RedDot2 = styled.div`
  background-color: red;
  width: 5px;
  height: 5px;
  position: absolute;
  left: 559px;
  top: 537px;
`;

type PuzzleProps = {
  puzzleData: PuzzleData[];
  characterTextureAtlasLookup: Record<string, [number, number]>;
  cellNumberTextureAtlasLookup: Record<string, [number, number]>;
};

const computeBoxForObject = function (object: Mesh) {
  const tempVector = new Vector3();
  const tempBox = new Box3();
  const box = new Box3();

  // Computes the world-axis-aligned bounding box of an object (including its children),
  // accounting for both the object's, and children's, world transforms

  object.updateWorldMatrix(false, false);

  var geometry = object.geometry;

  if (geometry !== undefined) {
    if (geometry.boundingBox === null) {
      geometry.computeBoundingBox();
    }

    // @ts-ignore
    if (object.isInstancedMesh) {
      console.log('hi');
      var matrixWorld = object.matrixWorld,
        // @ts-ignore
        matrix4Array = object.instanceMatrix.array,
        arrayLength = matrix4Array.length;
      for (var posOffset = 12; posOffset < arrayLength; posOffset += 16) {
        tempVector.set(
          matrix4Array[posOffset],
          matrix4Array[1 + posOffset],
          matrix4Array[2 + posOffset]
        );
        tempBox.expandByPoint(tempVector);
      }
    } else if (geometry.boundingBox != null) {
      tempBox.copy(geometry.boundingBox);
    }
    tempBox.applyMatrix4(object.matrixWorld);

    box.expandByPoint(tempBox.min);
    box.expandByPoint(tempBox.max);
  }

  var children = object.children;

  for (var i = 0, l = children.length; i < l; i++) {
    box.expandByObject(children[i]);
  }

  return box;
};

// TODO: Use this to get actual size of puzzle
// https://github.com/mrdoob/three.js/issues/18643

const getObjectSizeInViewSpace = (
  object: InstancedMeshType,
  camera: Camera
) => {
  const box = computeBoxForObject(object);
  const objectWidth = box.max.x - box.min.x;
  const objectHeight = box.max.y - box.min.y;

  console.log('expand', objectWidth, objectHeight);

  // Get 3D positions of top left corner (assuming they're not rotated)
  const topLeft = new Vector3(
    object.position.x - objectWidth / 2,
    object.position.y + objectHeight / 2,
    object.position.z
  );
  const bottomRight = new Vector3(
    object.position.x + objectWidth / 2,
    object.position.y - objectHeight / 2,
    object.position.z
  );

  // This converts x, y, z to the [-1, 1] range
  topLeft.project(camera);
  bottomRight.project(camera);

  // This converts from [-1, 1] to [0, windowWidth]
  const topLeftX = ((1 + topLeft.x) / 2) * window.innerWidth;
  const topLeftY = ((1 - topLeft.y) / 2) * window.innerHeight;

  const bottomRightX = ((1 + bottomRight.x) / 2) * window.innerWidth;
  const bottomRightY = ((1 - bottomRight.y) / 2) * window.innerHeight;

  console.log(topLeftX, topLeftY, bottomRightX, bottomRightY);
  console.log((1 + topLeft.x) / 2, window.innerWidth);
};

export default function Puzzle({
  puzzleData,
  characterTextureAtlasLookup,
  cellNumberTextureAtlasLookup,
}: PuzzleProps) {
  const router = useRouter();
  const [instancedRef, setInstancedMesh] = useState<InstancedMeshType | null>();
  const [cameraRef, setCameraRef] = useState<OrthographicCameraType>();
  const [selectedSide, setSelectedSide] = useState(0);
  const [containerRef, { width, height }] = useElementSize();

  const scale = useMemo(() => {
    if (cameraRef == null || instancedRef == null) {
      return 1;
    }

    // https://gist.github.com/ayamflow/462190f13eeef04f01cb
    getObjectSizeInViewSpace(instancedRef, cameraRef);
  }, [cameraRef, instancedRef]);

  // TODO: The Puzzle Grid should resize to the viewport
  // TODO: When selecting a cell, change bg for all letters in word
  // TODO: Create buttons to orient to a new side
  // TODO: Add swipe gesture to change sides
  // TODO: Lock camera when playing to front view only
  // TODO: Run on vercel to test on phone
  // TODO: Add cool flippy animations
  // TODO: Add a keyboard: https://www.npmjs.com/package/react-simple-keyboard
  // TODO: Change color when changing sides?
  // TODO: Make this multiplayer where different people can work on different sides?
  // TODO: Add top and bottom sides?
  // TODO: When you complete a side, animate it and change the color

  return (
    <Container ref={containerRef}>
      <Canvas>
        <OrthographicCamera
          ref={setCameraRef}
          makeDefault
          zoom={50}
          near={1}
          far={2000}
          position={[0, -3, 200]}
        />
        <ambientLight />
        <pointLight position={[5, 5, 5]} />
        <PresentationControls global>
          <group position={[-3.5, -3.5, 3.5]}>
            <LetterBoxes
              setInstancedMesh={setInstancedMesh}
              puzzleData={puzzleData}
              characterTextureAtlasLookup={characterTextureAtlasLookup}
              cellNumberTextureAtlasLookup={cellNumberTextureAtlasLookup}
              selectedSide={selectedSide}
            />
          </group>
        </PresentationControls>
      </Canvas>
      <Stats />
      <RedDot1 />
      <RedDot2 />
    </Container>
  );
}

const getStaticPaths: GetStaticPaths = async () => {
  const paths = (await getPuzzles()).map((fileName) => ({
    params: {
      slug: fileName,
    },
  }));
  return {
    paths,
    fallback: true,
  };
};

const getStaticProps: GetStaticProps<PuzzleProps, { slug: string }> = async ({
  params,
}) => {
  await generateTextures();

  const puzzleData = await getPuzzleById(params?.slug ?? '');
  const characterTextureAtlasLookup = TEXTURE_RECORD;
  const cellNumberTextureAtlasLookup = NUMBER_RECORD;
  return {
    props: {
      puzzleData,
      characterTextureAtlasLookup,
      cellNumberTextureAtlasLookup,
    },
  };
};

export { getStaticProps, getStaticPaths };
