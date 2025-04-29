import { MyContext } from './context'; // Import your context type
import { Resolvers } from '../../lib/gql-types'; // Import generated resolver types

export const resolvers: Resolvers<MyContext> = {
  Query: {
    hello: (_, __, context) => {
      // Example: Access currentUser from context
      const userName = context.currentUser?.email || 'world';
      return `Hello ${userName}!`;
    },
    // Add other query resolvers here
  },
  Mutation: {
    noop: () => 'This mutation does nothing yet.',
    // Add mutation resolvers here
  },
  // Add resolvers for other types (e.g., User, Organization) if needed
}; 