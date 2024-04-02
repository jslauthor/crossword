import { PrismaClient } from '@prisma/client/edge';
import type * as Party from 'partykit/server';
import { onConnect } from 'y-partykit';
import { Buffer } from 'buffer';
import { encodeStateAsUpdateV2, Doc, applyUpdateV2 } from 'yjs';
import { createInitialYDoc } from 'lib/utils/puzzle';

const prisma = new PrismaClient();

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    return onConnect(conn, this.room, {
      persist: {
        mode: 'snapshot',
      },
      // async load() {
      //   try {
      //     const url = new URL(ctx.request.url);
      //     const clerkId = url.searchParams.get('clerkId');
      //     const puzzleId = url.searchParams.get('puzzleId');
      //     const user = await prisma.user.findFirst({
      //       where: {
      //         clerkId,
      //       },
      //     });
      //     if (user == null || puzzleId == null) {
      //       throw new Error(
      //         `Load: User or puzzle not found! ${user?.id} ${puzzleId}`,
      //       );
      //     }
      //     const progress = await prisma.progress.findFirst({
      //       where: {
      //         userId: user.id,
      //         puzzleId,
      //       },
      //     });
      //     if (progress == null) {
      //       throw new Error(
      //         `Load: Progress not found for! ${user?.id} ${puzzleId}`,
      //       );
      //     }
      //     const doc = new Doc();
      //     const state = Buffer.from(progress.state);
      //     applyUpdateV2(doc, state);
      //     return doc;
      //   } catch (e) {
      //     console.error(e);
      //     return null;
      //   }
      // },
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
                `Save: User or puzzle not found! ${user?.id} ${puzzleId}`,
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
