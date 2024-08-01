import { createClient } from '@vercel/kv';

export default createClient({
  url: process.env.REDIS_REST_API_URL,
  token: process.env.REDIS_REST_API_TOKEN,
});
