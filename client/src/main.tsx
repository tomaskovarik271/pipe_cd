import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// import { ApolloProvider } from '@apollo/client' // Comment out for build test
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
// import { client } from '@/apollo-client.ts' // Comment out for build test
// import { AuthProvider } from '@/context/AuthContext.tsx' // Comment out for build test
// import { supabase } from '@/supabase-client.ts'; // Remove direct supabase import
import { useAuth } from '@/hooks/useAuth.tsx'; // Import useAuth hook directly

// Temporary component to test useAuth hook
const AuthTester: React.FC = () => {
  const { session, loading } = useAuth();
  console.log('AuthTester:', { session, loading });
  return null; // Don't render anything
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* <AuthProvider> */}{/* Comment out for build test */}
      {/* <ApolloProvider client={client}> */}{/* Comment out for build test */}
        <ChakraProvider value={defaultSystem}>
          <AuthTester /> { /* Render the tester component */}
          <App />
        </ChakraProvider>
      {/* </ApolloProvider> */}{/* Comment out for build test */}
    {/* </AuthProvider> */}{/* Comment out for build test */}
  </React.StrictMode>,
)
