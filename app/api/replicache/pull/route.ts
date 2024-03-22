import { currentUser } from '@clerk/nextjs';
import {
  ClientGroup,
  getClientGroup,
  getClientsMetadata,
  getOrCreateVersionedProgress,
  getUserForClerkId,
  putClientGroup,
} from 'lib/db';
import { NextResponse, NextRequest } from 'next/server';
import { kv } from 'lib/kv';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import {
  CVR,
  CVREntries,
  diffCVR,
  getCvrEntries,
  isCVRDiffEmpty,
} from 'lib/replicache/cvr';
import { PatchOperation, PullResponse } from 'replicache';

const cookie = z.object({
  order: z.number(),
  cvrID: z.string(),
});

type Cookie = z.infer<typeof cookie>;

const pullRequest = z.object({
  clientGroupID: z.string(),
  cookie: z.union([cookie, z.null()]),
});

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
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

  const pull = pullRequest.parse(await request.json());
  const { clientGroupID } = pull;

  // 1: Fetch prevCVR
  const prevCVR: CVR | undefined | null = pull.cookie
    ? await kv.get(pull.cookie.cvrID)
    : undefined;
  // 2: Init baseCVR
  const baseCVR: CVR = prevCVR ?? {};
  console.log({ prevCVR, baseCVR });

  // Begin transaction
  const result = await prisma.$transaction(async (tx) => {
    // Grab CVR cache from Redis

    let progress = await getOrCreateVersionedProgress(tx, user.id, puzzleId);

    // Get client group and verify user owns group
    const baseClientGroup = await getClientGroup(tx, user.id, clientGroupID);
    const clientsMetadata = await getClientsMetadata(tx, clientGroupID);

    // Build the next Client View Record
    const nextCVR: CVR = {
      progress: getCvrEntries([progress]),
      client: getCvrEntries(clientsMetadata),
    };

    const diff = diffCVR(baseCVR, nextCVR);
    console.log('diff', { diff });

    // If diff is empty, return no-op PR
    if (prevCVR && isCVRDiffEmpty(diff)) {
      return null;
    }

    // Look for changed clients
    const clients: CVREntries = {};
    for (const clientId of diff.client.puts) {
      clients[clientId] = nextCVR.client[clientId];
    }
    console.log('clients', { clients });

    // set nextCVRVersion
    const baseCVRVersion = pull.cookie?.order ?? 0;
    const nextCVRVersion =
      Math.max(baseCVRVersion, baseClientGroup.cvrVersion) + 1;

    // Write ClientGroupRecord
    const nextClientGroupRecord: ClientGroup = {
      ...baseClientGroup,
      cvrVersion: nextCVRVersion,
    };
    console.log('nextClientGroupRecord', { nextClientGroupRecord });
    await putClientGroup(tx, nextClientGroupRecord);

    return {
      entities: {
        progress: {
          dels: diff.progress.dels,
          puts: [progress],
        },
      },
      clients,
      nextCVR,
      nextCVRVersion,
    };
  });

  // Default response is a noop
  let response: PullResponse = {
    cookie: pull.cookie,
    lastMutationIDChanges: {},
    patch: [],
  };

  // Build the response if there were changes
  if (result != null) {
    const { entities, clients, nextCVR, nextCVRVersion } = result;

    // 16-17: store cvr
    const cvrID = nanoid();
    await kv.set(cvrID, nextCVR);

    // 18(i): build patch
    const patch: PatchOperation[] = [];
    if (prevCVR === undefined) {
      patch.push({ op: 'clear' });
    }

    for (const [name, { puts, dels }] of Object.entries(entities)) {
      for (const id of dels) {
        patch.push({ op: 'del', key: `${name}/${id}` });
      }
      for (const entity of puts) {
        patch.push({
          op: 'put',
          key: `${name}/${entity.id}`,
          value: entity,
        });
      }
    }

    // 18(ii): construct cookie
    const cookie: Cookie = {
      order: nextCVRVersion,
      cvrID,
    };

    // 17(iii): lastMutationIDChanges
    const lastMutationIDChanges = clients;

    response = {
      cookie,
      lastMutationIDChanges,
      patch,
    };
  }

  return NextResponse.json(response, { status: 200 });
}
