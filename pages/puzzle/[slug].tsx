import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { getPuzzleById, getPuzzles } from '../../lib/utils/reader';

type PuzzleProps = { message: 'hello' };

export default function Puzzle({ message }: PuzzleProps) {
  const router = useRouter();
  const { slug } = router.query;
  return (
    <h1>
      <>
        {slug} {message}
      </>
    </h1>
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

const getStaticProps: GetStaticProps<
  { message: 'hello' },
  { slug: string }
> = async ({ params }) => {
  const puzzleData = await getPuzzleById(params?.slug ?? '');
  return {
    props: { message: 'hello' },
  };
};

export { getStaticProps, getStaticPaths };
