import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ApolloProvider } from '@apollo/client'
// import { ChakraProvider } from '@chakra-ui/react' // Temporarily remove Chakra
import { ChakraProvider, defaultSystem } from '@chakra-ui/react' // Import defaultSystem for v3
import { client } from '@/apollo-client.ts' // Import our Apollo client using Vite alias
import { AuthProvider } from './context/AuthContext' // Import AuthProvider
// We are not using Supabase provider directly here, auth state is handled via client/hooks

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider> {/* Wrap with AuthProvider */}
      <ApolloProvider client={client}>
        {/* <ChakraProvider> */}
        <ChakraProvider value={defaultSystem}>
        {/* TODO: Re-enable ChakraProvider. Currently commented out due to persistent type errors */}
        {/* (likely related to React 18/19 types or library incompatibilities). See DEVELOPER_RUNBOOK.md Section 5.3 */}
          <App />
        {/* </ChakraProvider> */}
        </ChakraProvider>
      </ApolloProvider>
    </AuthProvider> {/* Close AuthProvider */}
  </React.StrictMode>,
)
