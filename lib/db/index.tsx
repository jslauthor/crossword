import { Prisma, ReplicacheClientGroup } from '@prisma/client';
import prisma from 'lib/prisma';
import { convertProgressToJson, createInitialProgress } from 'lib/utils/puzzle';
import { getPuzzleById } from 'lib/utils/reader';

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
) => {
  return await prisma.progress.upsert({
    where: {
      puzzleId_userId: {
        userId,
        puzzleId,
      },
    },
    update: {
      data,
      version: {
        increment: 1,
      },
    },
    create: {
      userId,
      puzzleId,
      data,
      type: 'CROSSCUBE',
    },
  });
};

export type ClientGroup = Omit<
  ReplicacheClientGroup,
  'createdAt' | 'updatedAt'
>;

export const putClientGroup = async (
  tx: Prisma.TransactionClient,
  { id, cvrVersion, userId }: ClientGroup,
) => {
  await tx.replicacheClientGroup.upsert({
    where: {
      id,
    },
    update: {
      cvrVersion,
    },
    create: {
      id,
      userId,
      cvrVersion,
    },
  });
};

export const getOrCreateVersionedProgress = async (
  tx: Prisma.TransactionClient,
  userId: string,
  puzzleId: string,
) => {
  let progress = await getPuzzleProgressForUser(userId, puzzleId);

  if (progress == null) {
    const puzzle = await getPuzzleById(puzzleId);
    if (puzzle == null) {
      throw new Error('Puzzle not found');
    }
    progress = await upsertPuzzleProgress(
      puzzleId,
      userId,
      convertProgressToJson(createInitialProgress(puzzle)),
    );
    return {
      id: progress.id,
      rowversion: 0,
    };
  }

  return {
    id: progress.id,
    rowversion: progress.version,
  };
};

export const getClientGroup = async (
  tx: Prisma.TransactionClient,
  userId: string,
  clientGroupId: string,
): Promise<ClientGroup> => {
  const group = await tx.replicacheClientGroup.findFirst({
    where: {
      id: clientGroupId,
    },
  });
  if (group == null) {
    return {
      id: clientGroupId,
      userId,
      cvrVersion: 0,
    };
  }

  if (userId !== group.userId) {
    throw new Error('Unauthorized: Client group does not belong to user!');
  }
  return {
    id: clientGroupId,
    userId,
    cvrVersion: group.cvrVersion,
  };
};

export const getClientsMetadata = async (
  tx: Prisma.TransactionClient,
  clientGroupId: string,
) => {
  return (
    await tx.replicacheClient.findMany({
      where: {
        clientGroupId,
      },
      select: {
        id: true,
        lastMutationID: true,
      },
    })
  ).map((client) => ({
    id: client.id,
    rowversion: client.lastMutationID,
  }));
};
