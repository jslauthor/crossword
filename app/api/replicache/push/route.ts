import { currentUser } from '@clerk/nextjs';
import {
  Client,
  getClient,
  getClientGroup,
  getOrCreateProgress,
  getUserForClerkId,
  putClient,
  putClientGroup,
  updateCellDraftModes,
  updateCharacterPosition,
  updateTime,
  updateValidations,
} from 'lib/db';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { mutators } from 'lib/replicache/mutators';
import { Prisma, Progress } from '@prisma/client';
import { POKE_EVENT, pusher } from 'lib/pusher';

const mutationSchema = z.object({
  id: z.number(),
  clientID: z.string(),
  name: z.enum(Object.keys(mutators) as [keyof typeof mutators]),
  args: z.any(),
});

type Mutation = z.infer<typeof mutationSchema>;

const pushRequestSchema = z.object({
  clientGroupID: z.string(),
  mutations: z.array(mutationSchema),
});

export type Affected = {
  ids: [string, string][];
};

export const dynamic = 'force-dynamic'; // defaults to auto
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await getUserForClerkId(clerkUser.id);
  if (user == null) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const puzzleId = request.nextUrl.searchParams.get('puzzleId');
  if (puzzleId == null) {
    return NextResponse.json({ error: 'Missing puzzle ID' }, { status: 400 });
  }

  const allAffected = {
    ids: new Set<string>(),
  };

  const push = pushRequestSchema.parse(await request.json());
  for (const mutation of push.mutations) {
    try {
      const affected = await processMutation(
        user.id,
        puzzleId,
        push.clientGroupID,
        mutation,
        false,
      );
      for (const ids of affected.ids) {
        allAffected.ids.add(ids.join(':'));
      }
    } catch (e) {
      await processMutation(
        user.id,
        puzzleId,
        push.clientGroupID,
        mutation,
        true,
      );
    }
  }

  for (const id of allAffected.ids) {
    console.log('poking', id);
    pusher.trigger(id, POKE_EVENT, {
      id: Date.now,
      data: 'poke',
    });
  }

  console.log('Processed all mutations in', Date.now() - startTime);
  return NextResponse.json(null, { status: 200 });
}

// Implements the push algorithm from
// https://doc.replicache.dev/strategies/row-version#push
async function processMutation(
  userID: string,
  puzzleId: string,
  clientGroupId: string,
  mutation: Mutation,
  // 1: `let errorMode = false`. In JS, we implement this step naturally
  // as a param. In case of failure, caller will call us again with `true`.
  errorMode: boolean,
): Promise<Affected> {
  // 2: beginTransaction
  return await prisma.$transaction(async (tx) => {
    let affected: Affected = { ids: [] };

    console.log(
      'Processing mutation',
      errorMode ? 'errorMode' : '',
      JSON.stringify(mutation, null, ''),
    );

    // 3: `getClientGroup(body.clientGroupID)`
    // 4: Verify requesting user owns cg (in function)
    const clientGroup = await getClientGroup(userID, clientGroupId, tx);
    // 5: `getClient(mutation.clientID)`
    // 6: Verify requesting client group owns requested client
    const baseClient = await getClient(mutation.clientID, clientGroupId, tx);

    // 7: init nextMutationID
    const nextMutationID = baseClient.lastMutationID + 1;

    // 8: rollback and skip if already processed.
    if (mutation.id < nextMutationID) {
      console.log(
        `Mutation ${mutation.id} has already been processed - skipping`,
      );
      return affected;
    }

    // 9: Rollback and error if from future.
    if (mutation.id > nextMutationID) {
      throw new Error(`Mutation ${mutation.id} is from the future - aborting`);
    }

    const t1 = Date.now();

    if (!errorMode) {
      try {
        // 10(i): Run business logic
        // 10(i)(a): we update the version of the progress object in each mutation
        affected = await mutate(userID, puzzleId, mutation, tx);
      } catch (e) {
        // 10(ii)(a-c): log error, abort, and retry
        console.error(
          `Error executing mutation: ${JSON.stringify(mutation)}: ${e}`,
        );
        throw e;
      }
    }

    // 11-12: put client and client group
    const nextClient: Client = {
      id: mutation.clientID,
      clientGroupId,
      lastMutationID: nextMutationID,
    };

    await Promise.all([
      putClientGroup(clientGroup, tx),
      putClient(nextClient, tx),
    ]);

    console.log('Processed mutation in', Date.now() - t1);
    return affected;
  });
}

async function mutate(
  userId: string,
  puzzleId: string,
  mutation: Mutation,
  tx: Prisma.TransactionClient = prisma,
): Promise<Affected> {
  const progress: Progress = await getOrCreateProgress(userId, puzzleId, tx);
  switch (mutation.name) {
    case 'setTime':
      return await updateTime(progress, z.number().parse(mutation.args), tx);
    case 'setCharacterPosition':
      return await updateCharacterPosition(
        progress,
        z.record(z.number()).parse(mutation.args),
        tx,
      );
    case 'setCellDraftModes':
      return await updateCellDraftModes(
        progress,
        z.record(z.number()).parse(mutation.args),
        tx,
      );
    case 'setValidations':
      return await updateValidations(
        progress,
        z.record(z.number()).parse(mutation.args),
        tx,
      );
    default:
      return {
        ids: [],
      };
  }
}
