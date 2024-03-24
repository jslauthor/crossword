import Pusher from 'pusher';

export const POKE_EVENT = 'replicache-poke';

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID ?? '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY ?? '',
  secret: process.env.PUSHER_SECRET ?? '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? '',
  useTLS: true,
});
