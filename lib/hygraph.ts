import {
  ApolloClient,
  InMemoryCache,
  gql,
  createHttpLink,
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

// Initialize Apollo Client
export const readOnlyClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
