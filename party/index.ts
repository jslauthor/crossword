import type * as Party from 'partykit/server';
import { onConnect } from 'y-partykit';

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // A websocket just connected!
    console.log(
      `Connected:
        id: ${conn.id}
        room: ${this.room.id}
        url: ${new URL(ctx.request.url).pathname}`,
    );

    // let's send a message to the connection
    conn.send('hello from server');

    return onConnect(conn, this.room, {
      persist: {
        mode: 'snapshot',
      },
      callback: {
        async handler(yDoc) {
          console.log('yDoc', yDoc);
        },
      },
    });
  }

  onMessage(message: string, sender: Party.Connection) {
    // let's log the message
    console.log(`connection ${sender.id} sent message: ${message}`);
    // as well as broadcast it to all the other connections in the room...
    this.room.broadcast(
      `${sender.id}: ${message}`,
      // ...except for the connection it came from
      [sender.id],
    );
  }

  onRequest(req: Party.Request): Response | Promise<Response> {
    // let's log the request
    console.log(`request received: ${req.url}`);
    // and return a simple response
    return new Response('hello from server');
  }
}

Server satisfies Party.Worker;
