import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ApolloProvider } from '@apollo/client'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { client } from './apollo-client'
import { AuthProvider } from './context/AuthContext'
// import { supabase } from '@/supabase-client.ts'; // Keep commented out
// import { useAuth } from '@/hooks/useAuth.tsx'; // Keep commented out

// Remove temporary component
// const AuthTester: React.FC = () => {
//   const { session, loading } = useAuth();
//   console.log('AuthTester:', { session, loading });
//   return null; // Don't render anything
// };

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ApolloProvider client={client}>
        <ChakraProvider value={defaultSystem}>
          {/* <AuthTester /> */}{/* Keep commented out */}
          <App />
        </ChakraProvider>
      </ApolloProvider>
    </AuthProvider>
  </React.StrictMode>,
)
