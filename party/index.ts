import { PrismaClient } from '@prisma/client/edge';
import type * as Party from 'partykit/server';
import { onConnect } from 'y-partykit';
import { Buffer } from 'buffer';
import { encodeStateAsUpdate } from 'yjs';
import { verifyToken } from '@clerk/backend';

const prisma = new PrismaClient();

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  static async onBeforeConnect(request: Party.Request, lobby: Party.Lobby) {
    try {
      const token = new URL(request.url).searchParams.get('token') ?? '';
      const session = await verifyToken(token, {
        secretKey: lobby.env.CLERK_SECRET_KEY as string,
      });
      request.headers.set('X-User-ID', session.sub);
      // forward the request onwards on onConnect
      return request;
    } catch (e) {
      console.error(e);
      return new Response('Unauthorized', { status: 401 });
    }
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    return onConnect(conn, this.room, {
      persist: {
        mode: 'snapshot',
      },
      callback: {
        async handler(yDoc) {
          try {
            const url = new URL(conn.uri);
            const clerkId = url.searchParams.get('clerkId');
            const puzzleId = url.searchParams.get('puzzleId');
            const user = await prisma.user.findFirst({
              where: {
                clerkId,
              },
            });
            if (user == null || puzzleId == null) {
              throw new Error(
                `Save: User or puzzle not found! ${clerkId} ${user?.id} ${puzzleId}`,
              );
            }
            const state = Buffer.from(encodeStateAsUpdate(yDoc));
            await prisma.progress.upsert({
              where: {
                puzzleId_userId: {
                  userId: user?.id,
                  puzzleId,
                },
              },
              update: {
                state,
              },
              create: {
                userId: user?.id,
                puzzleId,
                state,
              },
            });
          } catch (e) {
            console.error('Error saving progress to postgres!', e);
          }
        },
        // save every second
        debounceWait: 1000,
        // if updates keep coming, save at least once every 10 seconds (default)
        debounceMaxWait: 1000,
      },
    });
  }
}

Server satisfies Party.Worker;
