import prisma from 'lib/prisma';
import { Doc, encodeStateAsUpdateV2 } from 'yjs';

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
  const content = Buffer.from(encodeStateAsUpdateV2(state));
  return prisma.progress.upsert({
    where: {
      userId: userId,
      puzzleId: puzzleId,
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
