import { ChakraProvider } from '@chakra-ui/react'

import theme from '../theme'
import { AppProps } from 'next/app'
import { Provider, createClient } from 'urql'

function MyApp({ Component, pageProps }: AppProps) {

  // create urql client pointing to graphql server
  // and allowing cookies to be sent
  const client = createClient({
    url: 'http://localhost:4000/graphql',
    fetchOptions: {
      credentials: "include",
    }
  });

  return (
    <Provider value={client}>
      <ChakraProvider resetCSS theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </Provider>
  )
}

export default MyApp
