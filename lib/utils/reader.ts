import { DifficultyEnum } from 'components/svg/IconStar';
import { queryDato } from 'lib/dato';
import { PuzzleData } from 'types/types';

export const getPuzzles = async (
  first: number = 100,
  skip: number = 0,
): Promise<
  {
    id: string;
    difficulty: DifficultyEnum;
    puzzleType: string;
    data: PuzzleData[];
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
          orderBy: _firstPublishedAt_ASC
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
