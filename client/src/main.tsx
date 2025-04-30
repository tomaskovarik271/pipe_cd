import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// import { ApolloProvider } from '@apollo/client' // Comment out for build test
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
// import { client } from '@/apollo-client.ts' // Comment out for build test
// import { AuthProvider } from '@/context/AuthContext' // Comment out for build test

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* <AuthProvider> */}{/* Comment out for build test */}
      {/* <ApolloProvider client={client}> */}{/* Comment out for build test */}
        <ChakraProvider value={defaultSystem}>
          <App />
        </ChakraProvider>
      {/* </ApolloProvider> */}{/* Comment out for build test */}
    {/* </AuthProvider> */}{/* Comment out for build test */}
  </React.StrictMode>,
)
