import { PrismaClient } from '@prisma/client/edge';
import { CACHE_ID_KEY } from 'lib/utils/puzzle';
import type * as Party from 'partykit/server';
import { onConnect } from 'y-partykit';
import { Buffer } from 'buffer';
import { encodeStateAsUpdateV2 } from 'yjs';

const prisma = new PrismaClient();

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    return onConnect(conn, this.room, {
      persist: {
        mode: 'snapshot',
      },
      callback: {
        async handler(yDoc) {
          try {
            const cacheId = yDoc.getText(CACHE_ID_KEY).toString();
            const [clerkId, puzzleId] = cacheId.split(':');
            const user = await prisma.user.findFirst({
              where: {
                clerkId,
              },
            });
            if (user == null || puzzleId == null) {
              throw new Error(
                `User or puzzle not found! ${user?.id} ${puzzleId}`,
              );
            }
            const state = Buffer.from(encodeStateAsUpdateV2(yDoc));
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
      },
    });
  }

  // onMessage(message: string, sender: Party.Connection) {
  //   // let's log the message
  //   console.log(`connection ${sender.id} sent message: ${message}`);
  //   // as well as broadcast it to all the other connections in the room...
  //   this.room.broadcast(
  //     `${sender.id}: ${message}`,
  //     // ...except for the connection it came from
  //     [sender.id],
  //   );
  // }

  // onRequest(req: Party.Request): Response | Promise<Response> {
  //   // let's log the request
  //   console.log(`request received: ${req.url}`);
  //   // and return a simple response
  //   return new Response('hello from server');
  // }
}

Server satisfies Party.Worker;
