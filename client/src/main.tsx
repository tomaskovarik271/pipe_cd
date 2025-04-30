import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ApolloProvider } from '@apollo/client'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { client } from '@/apollo-client.ts'
import { AuthProvider } from '@/context/AuthContext.tsx'
// import { supabase } from '@/supabase-client.ts'; // Remove direct supabase import
// import { useAuth } from '@/hooks/useAuth.tsx'; // Remove direct useAuth import

// Remove temporary component
// const AuthTester: React.FC = () => {
//   const { session, loading } = useAuth();
//   console.log('AuthTester:', { session, loading });
//   return null; // Don't render anything
// };

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider> {/* Restore AuthProvider */}
      <ApolloProvider client={client}> {/* Restore ApolloProvider */}
        <ChakraProvider value={defaultSystem}>
          {/* <AuthTester /> */}{/* Remove tester component */}
          <App />
        </ChakraProvider>
      </ApolloProvider> {/* Restore ApolloProvider */}
    </AuthProvider> {/* Restore AuthProvider */}
  </React.StrictMode>,
)
