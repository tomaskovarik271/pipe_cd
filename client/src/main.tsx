import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// import { ApolloProvider } from '@apollo/client' // Comment out for build test
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
// import { client } from '@/apollo-client.ts' // Comment out for build test
import { AuthProvider } from '@/context/AuthContext.tsx' // Re-introduce AuthProvider
// import { DUMMY_MESSAGE } from '@/dummy.ts'; // Remove dummy import
import { supabase } from '@/supabase-client.ts'; // Import supabase client directly

// Log the dummy message to ensure it's used and not tree-shaken too early
// console.log(DUMMY_MESSAGE); // Remove dummy log
// console.log(supabase); // Remove test log

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider> {/* Re-introduce AuthProvider */}
      {/* <ApolloProvider client={client}> */}{/* Comment out for build test */}
        <ChakraProvider value={defaultSystem}>
          <App />
        </ChakraProvider>
      {/* </ApolloProvider> */}{/* Comment out for build test */}
    </AuthProvider> {/* Re-introduce AuthProvider */}
  </React.StrictMode>,
)
