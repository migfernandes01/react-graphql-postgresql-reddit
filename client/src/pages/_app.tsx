import { ChakraProvider, ThemeConfig } from '@chakra-ui/react';

// import theme from '../theme';
import { AppProps } from 'next/app';
import { Provider, createClient } from 'urql';
import {extendTheme} from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false
}

const theme = extendTheme({ config });

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
