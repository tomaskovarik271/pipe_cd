import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// import { ApolloProvider } from '@apollo/client' // Comment out for build test
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
// import { client } from '@/apollo-client.ts' // Comment out for build test
// import { AuthProvider } from '@/context/AuthContext.tsx' // Comment out for build test
import { DUMMY_MESSAGE } from '@/dummy.ts'; // Import from new dummy file using alias

// Log the dummy message to ensure it's used and not tree-shaken too early
console.log(DUMMY_MESSAGE);

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
