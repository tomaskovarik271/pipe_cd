import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// import { ApolloProvider } from '@apollo/client' // Keep commented out
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
// import { client } from '@/apollo-client.ts' // Keep commented out
// import { AuthProvider } from '@/context/AuthContext.tsx' // Re-comment AuthProvider
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
    {/* <AuthProvider> */}{/* Re-comment AuthProvider */}
      {/* <ApolloProvider client={client}> */}{/* Keep commented out */}
        <ChakraProvider value={defaultSystem}>
          {/* <AuthTester /> */}{/* Remove tester component */}
          <App />
        </ChakraProvider>
      {/* </ApolloProvider> */}{/* Keep commented out */}
    {/* </AuthProvider> */}{/* Re-comment AuthProvider */}
  </React.StrictMode>,
)
