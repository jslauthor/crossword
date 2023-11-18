import prisma from 'lib/prisma';

export const getPuzzleProgressForUser = (userId: string, puzzleId: string) => {
  return prisma.progress.findFirst({
    where: {
      userId: userId,
      puzzleId: puzzleId,
    },
  });
};

export const getPuzzlesProgressForUser = (
  userId: string,
  puzzleIds: string[],
) => {
  return prisma.progress.findMany({
    where: {
      userId,
      puzzleId: {
        in: puzzleIds,
      },
    },
  });
};

export const getUserForClerkId = (clerkId: string) => {
  return prisma.user.findFirst({
    where: {
      clerkId,
    },
  });
};
