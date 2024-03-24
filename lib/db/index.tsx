import {
  Prisma,
  Progress,
  ReplicacheClient,
  ReplicacheClientGroup,
} from '@prisma/client';
import { Affected } from 'app/api/replicache/push/route';
import prisma from 'lib/prisma';
import { convertProgressToJson, createInitialProgress } from 'lib/utils/puzzle';
import { getPuzzleById } from 'lib/utils/reader';

export const getPuzzleProgressForUser = (
  userId: string,
  puzzleId: string,
  tx?: Prisma.TransactionClient,
) => {
  return (tx ?? prisma).progress.findFirst({
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
  tx?: Prisma.TransactionClient,
) => {
  return await (tx ?? prisma).progress.upsert({
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

export type Client = Omit<ReplicacheClient, 'createdAt' | 'updatedAt'>;

export const putClientGroup = async (
  { id, cvrVersion, userId }: ClientGroup,
  tx?: Prisma.TransactionClient,
) => {
  await (tx ?? prisma).replicacheClientGroup.upsert({
    where: {
      id,
    },
    update: {
      userId,
      cvrVersion,
    },
    create: {
      id,
      userId,
      cvrVersion,
    },
  });
};

export const getOrCreateProgress = async (
  userId: string,
  puzzleId: string,
  tx?: Prisma.TransactionClient,
): Promise<Progress> => {
  let progress = await getPuzzleProgressForUser(userId, puzzleId, tx);

  if (progress == null) {
    const puzzle = await getPuzzleById(puzzleId);
    if (puzzle == null) {
      throw new Error('Puzzle not found');
    }
    progress = await upsertPuzzleProgress(
      puzzleId,
      userId,
      convertProgressToJson(createInitialProgress(puzzle)),
      tx,
    );
    progress;
  }

  return progress;
};

export const getOrCreateVersionedProgress = async (
  userId: string,
  puzzleId: string,
  tx?: Prisma.TransactionClient,
) => {
  let progress = await getOrCreateProgress(userId, puzzleId, tx);

  return {
    id: progress.id,
    rowversion: progress.version,
  };
};

export const getClientGroup = async (
  userId: string,
  clientGroupId: string,
  tx?: Prisma.TransactionClient,
): Promise<ClientGroup> => {
  const group = await (tx ?? prisma).replicacheClientGroup.findFirst({
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
    id: group.id,
    userId: group.userId,
    cvrVersion: group.cvrVersion,
  };
};

export const getClient = async (
  clientId: string,
  clientGroupId: string,
  tx?: Prisma.TransactionClient,
) => {
  const client = await (tx ?? prisma).replicacheClient.findFirst({
    where: {
      id: clientId,
    },
    select: {
      id: true,
      clientGroupId: true,
      lastMutationID: true,
    },
  });

  if (client == null) {
    return {
      id: clientId,
      clientGroupID: '',
      lastMutationID: 0,
    };
  }

  if (client.clientGroupId !== clientGroupId) {
    throw new Error('Unauthorized: Client does not belong to group!');
  }

  return client;
};

export const putClient = async (
  { id, clientGroupId, lastMutationID }: Client,
  tx?: Prisma.TransactionClient,
) => {
  await (tx ?? prisma).replicacheClient.upsert({
    where: {
      id,
    },
    update: {
      clientGroupId,
      lastMutationID,
    },
    create: {
      id,
      clientGroupId,
      lastMutationID,
    },
  });
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

export const updateTime = async (
  progress: Progress,
  time: PrismaJson.ProgressType['time'],
  tx?: Prisma.TransactionClient,
): Promise<Affected> => {
  await upsertPuzzleProgress(
    progress.puzzleId,
    progress.userId,
    {
      ...progress.data,
      time,
    },
    tx,
  );
  return {
    ids: [[progress.userId, progress.puzzleId]],
  };
};

export const updateCharacterPosition = async (
  progress: Progress,
  state: PrismaJson.ProgressType['state'],
  tx?: Prisma.TransactionClient,
): Promise<Affected> => {
  await upsertPuzzleProgress(
    progress.puzzleId,
    progress.userId,
    {
      ...progress.data,
      state,
    },
    tx,
  );
  return {
    ids: [[progress.userId, progress.puzzleId]],
  };
};

export const updateCellDraftModes = async (
  progress: Progress,
  draftModes: PrismaJson.ProgressType['draftModes'],
  tx?: Prisma.TransactionClient,
): Promise<Affected> => {
  await upsertPuzzleProgress(
    progress.puzzleId,
    progress.userId,
    {
      ...progress.data,
      draftModes,
    },
    tx,
  );
  return {
    ids: [[progress.userId, progress.puzzleId]],
  };
};

export const updateValidations = async (
  progress: Progress,
  validations: PrismaJson.ProgressType['validations'],
  tx?: Prisma.TransactionClient,
): Promise<Affected> => {
  await upsertPuzzleProgress(
    progress.puzzleId,
    progress.userId,
    {
      ...progress.data,
      validations,
    },
    tx,
  );
  return {
    ids: [[progress.userId, progress.puzzleId]],
  };
};
