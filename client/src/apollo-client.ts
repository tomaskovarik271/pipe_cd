import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { supabase } from '@/supabase-client'; // Changed to alias

const httpLink = createHttpLink({
  // Use the relative path defined in netlify.toml redirects
  uri: '/graphql',
});

// Middleware to add the JWT token to requests
const authLink = setContext(async (_, { headers }) => {
  // Get the current session from Supabase
  // This happens async before every GraphQL request
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting Supabase session:', error);
    return { headers };
  }

  const token = session?.access_token;
  // console.log('Apollo authLink - session token:', token ? `Token found (${token.substring(0, 10)}...)` : 'No token');

  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  }
});

// Create the Apollo Client instance
export const client = new ApolloClient({
  // Chain the authLink and httpLink
  link: authLink.concat(httpLink),
  // Use the default in-memory cache
  cache: new InMemoryCache(),
}); 