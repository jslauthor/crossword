import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  NormalizedCacheObject,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'https://us-west-2.cdn.hygraph.com/content/cly83hf2e01ad07waoq2pzj2p/master',
});

const authLink = setContext((_, { headers }) => ({
  headers: {
    ...headers,
    Authorization: `Bearer ${process.env.HYGRAPH_API_TOKEN}`,
  },
}));

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

let lastCacheClear = Date.now();
const CACHE_LIFETIME = 60000; // 1 minute in milliseconds

export function getReadOnlyClient(): ApolloClient<NormalizedCacheObject> {
  const currentTime = Date.now();

  if (currentTime - lastCacheClear > CACHE_LIFETIME) {
    // Clear the cache if more than 1 minute has passed
    client.resetStore();
    lastCacheClear = currentTime;
    console.info('Cache cleared at:', new Date().toISOString());
  }

  return client;
}
