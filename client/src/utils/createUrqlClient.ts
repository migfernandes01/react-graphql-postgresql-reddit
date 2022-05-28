import { Cache, QueryInput, cacheExchange, Resolver } from "@urql/exchange-graphcache";
import { dedupExchange, fetchExchange, Exchange, stringifyVariables } from "urql";
import { LogoutMutation, MeQuery, MeDocument, LoginMutation, RegisterMutation } from "../generated/graphql";
import { pipe, tap } from "wonka";
import Router from 'next/router';

// execute this before any mutation/query
const errorExchange: Exchange = ({ forward }) => (ops$) => {
  return pipe(
    forward(ops$),
    tap(({ error }) => {
      // check if an error message includes "not authenticated"
      if(error?.message.includes("not authenticated")){
        Router.replace('/login');
      }
    })
  )
}

export type MergeMode = 'before' | 'after';

export const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;

    // get all fields for queries in cache
    const allFields = cache.inspectFields(entityKey);
    const fieldInfos = allFields.filter(info => info.fieldName === fieldName);
    const size = fieldInfos.length;
    // return undefined if no data
    if (size === 0) {
      return undefined;
    }

    // get data from cache and store it/return it
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`
    const isItInCache = cache.resolveFieldByKey(entityKey, fieldKey)
    info.partial = !isItInCache;
    const results: string[] = []; 
    fieldInfos.forEach(fi => {
      const data = cache.resolveFieldByKey(entityKey, fi.fieldKey) as string[];
      results.push(...data);
    })
    
    return results;

    /* const visited = new Set();
    let result: NullArray<string> = [];
    let prevOffset: number | null = null;

    for (let i = 0; i < size; i++) {
      const { fieldKey, arguments: args } = fieldInfos[i];
      if (args === null || !compareArgs(fieldArgs, args)) {
        continue;
      }

      const links = cache.resolve(entityKey, fieldKey) as string[];
      const currentOffset = args[cursorArgument];

      if (
        links === null ||
        links.length === 0 ||
        typeof currentOffset !== 'number'
      ) {
        continue;
      }

      const tempResult: NullArray<string> = [];

      for (let j = 0; j < links.length; j++) {
        const link = links[j];
        if (visited.has(link)) continue;
        tempResult.push(link);
        visited.add(link);
      }

      if (
        (!prevOffset || currentOffset > prevOffset) ===
        (mergeMode === 'after')
      ) {
        result = [...result, ...tempResult];
      } else {
        result = [...tempResult, ...result];
      }

      prevOffset = currentOffset;
    }

    const hasCurrentPage = cache.resolve(entityKey, fieldName, fieldArgs);
    if (hasCurrentPage) {
      return result;
    } else if (!(info as any).store.schema) {
      return undefined;
    } else {
      info.partial = true;
      return result;
    } */
  };
};

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
      resolvers: {
        Query: {
          posts: cursorPagination(),
        },
      },
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
    errorExchange,
    ssrExchange,
    fetchExchange
    ],
});