import prisma from 'lib/prisma';
import { Doc, encodeStateAsUpdate } from 'yjs';

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

export const upsertPuzzleProgress = (
  puzzleId: string,
  userId: string,
  state: Doc,
) => {
  const content = Buffer.from(encodeStateAsUpdate(state));
  return prisma.progress.upsert({
    where: {
      puzzleId_userId: {
        userId,
        puzzleId,
      },
    },
    update: {
      state: content,
    },
    create: {
      userId,
      puzzleId,
      state: content,
    },
  });
};
