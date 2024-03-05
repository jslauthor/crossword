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

export const upsertPuzzleProgress = async (
  puzzleId: string,
  userId: string,
  data: PrismaJson.ProgressType,
  usedHint?: boolean,
) => {
  return await prisma.progress.upsert({
    where: {
      puzzleId_userId: {
        userId,
        puzzleId,
      },
    },
    update: {
      usedHint,
      data,
    },
    create: {
      userId,
      puzzleId,
      data,
      type: 'CROSSCUBE',
    },
  });
};
