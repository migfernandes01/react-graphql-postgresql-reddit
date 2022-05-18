import { ChakraProvider, ThemeConfig } from '@chakra-ui/react';

// import theme from '../theme';
import { AppProps } from 'next/app';
import { Provider} from 'urql';
import {extendTheme} from '@chakra-ui/react';

// theme config
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false
}

const theme = extendTheme({ config });

function MyApp({ Component, pageProps }: AppProps) {

  return (
    <ChakraProvider resetCSS theme={theme}>
      <Component {...pageProps} />
    </ChakraProvider>
  )
}

export default MyApp
