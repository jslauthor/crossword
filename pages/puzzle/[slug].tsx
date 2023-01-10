import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { getPuzzleById, getPuzzles } from '../../lib/utils/reader';
import styled from '@emotion/styled';
import { Canvas } from '@react-three/fiber';
import {
  PresentationControls,
  OrthographicCamera,
  Stats,
} from '@react-three/drei';
import LetterBoxes from '../../components/core/3d/Box';
import { PuzzleData } from '../../types/types';
import { generateTextures } from '../../lib/utils/textures';

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
`;

type PuzzleProps = { puzzleData: PuzzleData[] };

export default function Puzzle({ puzzleData }: PuzzleProps) {
  const router = useRouter();
  // const { slug } = router.query;

  // TODO: Create buttons to orient to a new face
  // TODO: Change color when changing sides
  // TODO: Add a keyboard: https://www.npmjs.com/package/react-simple-keyboard

  return (
    <Container>
      <Canvas>
        <OrthographicCamera
          makeDefault
          zoom={50}
          near={1}
          far={2000}
          position={[0, 0, 200]}
        />
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <PresentationControls global>
          <group position={[-3, -3, 3]}>
            <LetterBoxes puzzleData={puzzleData} />
          </group>
        </PresentationControls>
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
