import { Cache, QueryInput, cacheExchange } from "@urql/exchange-graphcache";
import { dedupExchange, fetchExchange } from "urql";
import { LogoutMutation, MeQuery, MeDocument, LoginMutation, RegisterMutation } from "../generated/graphql";

// helper function to run a query after a mutation
// <MutationRan, QueryToRun>
function betterUpdateQuery<Result, Query> (
    cache: Cache,
    qi: QueryInput,
    result: any,
    fn: (r: Result, q: Query) => any
  ){
    return cache.updateQuery(qi, data => fn(result, data as any) as any)
}

// create URQL client with url of graphql server, cache options for mutations and SSR
export const createUrqlClient = (ssrExchange: any) => ({
    url: 'http://localhost:4000/graphql',
    fetchOptions: {
      credentials: "include" as const,          // make this field const for TS
    },
    exchanges: [dedupExchange, cacheExchange({  // add graphcache to urql client
      updates: {
        // run functions after executing certain mutations
        Mutation: {
          // run this when logout mutation executes
          logout: (_result, args, cache, info) => {
            // return user as null after Logout Mutation
            betterUpdateQuery<LogoutMutation, MeQuery>(
              cache, 
              { query: MeDocument },
              _result,
              () => ({ me: null })
            )
          },
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
    }),
    ssrExchange,
    fetchExchange
    ],
});