import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { getPuzzleById, getPuzzles } from '../../lib/utils/reader';
import styled from '@emotion/styled';

const Container = styled.div`
  width: 100%;
  height: 100%;
`;

type PuzzleProps = { puzzleData: any };

export default function Puzzle({ puzzleData }: PuzzleProps) {
  const router = useRouter();
  const { slug } = router.query;
  console.log(puzzleData);
  return (
    <Container>
      <h1>hi</h1>
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
