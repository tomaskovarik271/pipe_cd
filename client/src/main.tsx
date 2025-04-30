import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ApolloProvider } from '@apollo/client'
// import { ChakraProvider } from '@chakra-ui/react' // Temporarily remove Chakra
import { client } from './apollo-client.ts' // Import our Apollo client
// We are not using Supabase provider directly here, auth state is handled via client/hooks

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      {/* <ChakraProvider> */}
        <App />
      {/* </ChakraProvider> */}
    </ApolloProvider>
  </React.StrictMode>,
)
