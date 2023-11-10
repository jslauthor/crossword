import { queryDato } from 'lib/dato';

const getPuzzleDataBySlug = async (slug: string) => {
  const result = await queryDato({
    query: `
      {
        allPuzzles(
          filter: {
            slug: { eq: "${slug}" }
          }
        ) {
          data
        }
      }
    `,
  });

  return result?.allPuzzles[0]?.data;
};

export { getPuzzleDataBySlug };
