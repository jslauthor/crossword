import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { getPuzzleById, getPuzzles } from '../../lib/utils/reader';
import styled from '@emotion/styled';
import { Canvas } from '@react-three/fiber';
import THREE from '@react-three/fiber';
import {
  PresentationControls,
  OrthographicCamera,
  Text,
  Html,
  Stats,
} from '@react-three/drei';
import Box from '../../components/core/3d/Box';
import { PuzzleData } from '../../types/types';
import { useMemo } from 'react';
import { Euler, Vector3 } from 'three';
import { generateTextures } from '../../lib/utils/textures';

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
`;

type PuzzleProps = { puzzleData: PuzzleData[] };

export default function Puzzle({ puzzleData }: PuzzleProps) {
  const router = useRouter();
  const { slug } = router.query;

  const cells = useMemo(() => {
    const sides = [];
    const { width, height } = puzzleData[0].dimensions;
    let id = 0;
    for (let s = 0; s < puzzleData.length; s++) {
      const cells = [];
      const { puzzle } = puzzleData[s];
      for (let y = 0; y < puzzle.length; y++) {
        for (let x = 0; x < puzzle[y].length; x++) {
          id = id + 1;
          // skip the first item in each row other than the first side
          const isRepeated = s !== 0 && x === 0;
          const isNumber = typeof puzzle[y][x] === 'number';
          if (!isRepeated && (isNumber || puzzle[y][x] === ':')) {
            const position = new Vector3(x, y, 0);
            cells.push(
              <group>
                <Box position={position} />
              </group>
            );
          }
        }

        let position = new Vector3(0, 0, 0);
        let rotation = new Euler(0, 0, 0);

        if (s === 0) {
          position = new Vector3(0, 0, -width);
          rotation = new Euler(0, 0, 0);
        } else if (s === 1) {
          position = new Vector3(0, 0, -1);
          rotation = new Euler(0, Math.PI / 2, 0);
        } else if (s === 2) {
          position = new Vector3(width - 1, 0, -1);
          rotation = new Euler(0, Math.PI, 0);
        } else if (s === 3) {
          position = new Vector3(width - 1, 0, -width);
          rotation = new Euler(0, -Math.PI / 2, 0);
        }

        const group = (
          <group key={id} position={position} rotation={rotation}>
            {cells}
          </group>
        );
        sides.push(group);
      }
    }

    return (
      <group
        position={[width / 2 - 0.5, -height / 2 + 0.5, -width / 2 - 0.5]}
        rotation={[0, -Math.PI, 0]}
      >
        {sides}
      </group>
    );
  }, [puzzleData]);

  // TODO: Render the texture atlases server-side so the client doesn't have to
  // TODO: Builder texture atlas with satori and load the svg texture for the boxes
  // TODO: is there a way to build the boxes as one mesh?
  // TODO: Create buttons to orient to a new face
  // TODO: Change color when changing sides
  // TODO: Add a keyboard: https://www.npmjs.com/package/react-simple-keyboard

  return (
    <Container>
      <Canvas>
        {/** @ts-ignore */}
        <OrthographicCamera
          makeDefault
          zoom={50}
          near={1}
          far={2000}
          position={[0, 0, 200]}
        />
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <PresentationControls global>{cells}</PresentationControls>
      </Canvas>
      <Stats />
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
  return {
    props: { puzzleData },
  };
};

export { getStaticProps, getStaticPaths };
