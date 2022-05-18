import { ChakraProvider, ThemeConfig } from '@chakra-ui/react';

// import theme from '../theme';
import { AppProps } from 'next/app';
import { Provider, createClient, dedupExchange, fetchExchange } from 'urql';
import { cacheExchange, Cache, QueryInput } from '@urql/exchange-graphcache';
import {extendTheme} from '@chakra-ui/react';
import { LoginMutation, MeDocument, MeQuery, RegisterMutation } from '../generated/graphql';

// theme config
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false
}

const theme = extendTheme({ config });

// helper function to 
function betterUpdateQuery<Result, Query> (
  cache: Cache,
  qi: QueryInput,
  result: any,
  fn: (r: Result, q: Query) => Query
){
  return cache.updateQuery(qi, data => fn(result, data as any) as any)
}

function MyApp({ Component, pageProps }: AppProps) {

  // create urql client pointing to graphql server
  // and allowing cookies to be sent
  const client = createClient({
    url: 'http://localhost:4000/graphql',
    fetchOptions: {
      credentials: "include",
    },
    exchanges: [dedupExchange, cacheExchange({  // add graphcache to urql client
      updates: {
        // run functions after executing certain mutations
        Mutation: {
          // run this when login mutation executes
          login: (_result, args, cache, info) => { 
            // call 'me()' query
            // update 'me' if user logs in
            betterUpdateQuery<LoginMutation, MeQuery>(
              cache, 
              { query: MeDocument },
              _result,
              (result, query) => {
                if(result.login.errors){
                  return query;
                } else {
                  return {
                    me:{
                      user: result.login.user
                    }
                  };
                }
              }
            )
          },
          // run this when register mutation executes
          register: (_result, args, cache, info) => { 
            // call 'me()' query
            // update 'me' if user registers
            betterUpdateQuery<RegisterMutation, MeQuery>(
              cache, 
              { query: MeDocument },
              _result,
              (result, query) => {
                if(result.register.errors){
                  return query;
                } else {
                  return {
                    me:{
                      user: result.register.user
                    }
                  };
                }
              }
            )
          }
        }
      }
    }), fetchExchange],   
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
