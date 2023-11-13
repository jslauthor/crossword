import { queryDato } from 'lib/dato';

export const getPuzzles = async (
  first: number = 100,
  skip: number = 0,
): Promise<
  {
    id: string;
    difficulty: number;
    puzzleType: string;
    data: string;
    author: { fullName: string };
    isAiAssisted: boolean;
    title: string;
    slug: string;
    _firstPublishedAt: string;
  }[]
> => {
  const result = await queryDato({
    query: `
      {
        allPuzzles(
          first: ${first},
          skip: ${skip},
        ) {
          id
          difficulty
          puzzleType
          data
          author {
            fullName
          }
          isAiAssisted
          slug
          title
          _status
          _firstPublishedAt
        }

        _allPuzzlesMeta {
          count
        }
      }
    `,
  });

  return result?.allPuzzles;
};

export const getPuzzleDataBySlug = async (slug: string) => {
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
