import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { getPuzzleById, getPuzzles } from '../../lib/utils/reader';
import styled from '@emotion/styled';
import { Canvas } from '@react-three/fiber';
import THREE from '@react-three/fiber';
import { PresentationControls, OrthographicCamera } from '@react-three/drei';
import Box from '../../components/core/3d/Box';
import { PuzzleData } from '../../types/types';
import { useMemo } from 'react';

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
    const sides: THREE.GroupProps[] = [];
    const { width, height } = puzzleData[0].dimensions;
    for (let s = 0; s < puzzleData.length; s++) {
      const cells: THREE.MeshProps[] = [];
      const { puzzle } = puzzleData[s];
      for (let y = 0; y < puzzle.length; y++) {
        for (let x = 0; x < puzzle[y].length; x++) {
          // skip the first item in each row other than the first side
          const isRepeated = s !== 0 && x === 0;
          if (
            !isRepeated &&
            (typeof puzzle[y][x] === 'number' || puzzle[y][x] === ':')
          ) {
            const position = [x, y, 0];
            cells.push(<Box position={position} />);
          }
        }

        let position = [0, 0, 0];
        let rotation = [0, 0, 0];

        if (s === 0) {
          position = [0, 0, -width];
          rotation = [0, 0, 0];
        } else if (s === 1) {
          position = [0, 0, -1];
          rotation = [0, Math.PI / 2, 0];
        } else if (s === 2) {
          position = [width - 1, 0, -1];
          rotation = [0, Math.PI, 0];
        } else if (s === 3) {
          position = [width - 1, 0, -width];
          rotation = [0, -Math.PI / 2, 0];
        }

        const group = (
          <group position={position} rotation={rotation}>
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
  const puzzleData = await getPuzzleById(params?.slug ?? '');
  return {
    props: { puzzleData },
  };
};

export { getStaticProps, getStaticPaths };
