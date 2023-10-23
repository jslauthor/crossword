import prisma from 'lib/prisma';

export const getPuzzleStateForUser = (userId: string, puzzleId: string) => {
  return prisma.progress.findFirst({
    where: {
      userId: userId,
      puzzleId: puzzleId,
    },
  });
};
