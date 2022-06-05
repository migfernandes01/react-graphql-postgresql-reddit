import { Cache, QueryInput, cacheExchange, Resolver } from "@urql/exchange-graphcache";
import { dedupExchange, fetchExchange, Exchange, stringifyVariables } from "urql";
import { LogoutMutation, MeQuery, MeDocument, LoginMutation, RegisterMutation, VoteMutationVariables, DeletePostMutationVariables } from "../generated/graphql";
import { pipe, tap } from "wonka";
import Router from 'next/router';
import gql from 'graphql-tag';
import { isServer } from "./isServer";

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
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    const isItInCache = cache.resolve(cache.resolveFieldByKey(entityKey, fieldKey) as string, "posts");
    info.partial = !isItInCache;
    let hasMore = true;
    const results: string[] = []; 
    fieldInfos.forEach(fi => {
      const key = cache.resolveFieldByKey(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(key, 'posts') as string[];
      const _hasMore = cache.resolve(key, 'hasMore');
      if(!_hasMore){
        hasMore = _hasMore as boolean;
      }
      results.push(...data);
    })
    
    return {
      __typename: "PaginatedPosts",
      hasMore: hasMore,
      posts: results
    };

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
export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  // set cookie to value of cookie in request headers
  let cookie = '';

  if(isServer()){
    cookie = ctx.req.headers.cookie;
  }
  return {
    url: 'http://localhost:4000/graphql',
    fetchOptions: {
      credentials: "include" as const,          // make this field const for TS
      headers: cookie ? {                       // if we have a cookie, send it as a fetch option
        cookie
      } : undefined
    },
    exchanges: [dedupExchange, cacheExchange({  // add graphcache to urql client
      keys: {
        PaginatedPosts: () => null
      },
      resolvers: {
        Query: {
          posts: cursorPagination(),
        },
      },
      // run some code after executing mutations
      updates: {
        // run functions after executing certain mutations
        Mutation: {
          // run this when deletePost mutation executes
          deletePost: (_result, args, cache, info) => {
            // invalidate cache for Post with id: args.id
            cache.invalidate({__typename: "Post", id: (args as DeletePostMutationVariables).id})
          },
          // run this when vote mutation executes
          vote: (_result, args, cache, info) => {
            // get postId and value from mutation args
            const { postId, value } = args as VoteMutationVariables;

            // get id and points for post with id of postId from cache
            const data: any = cache.readFragment(
              gql`
                fragment _ on Post {
                  id
                  points
                  voteStatus
                }
              `,
              { id: postId }
            );

            // if we got data back
            if (data) {
              // do nothing if post was upvoted and user is trying to upvote
              // OR if post was downvoted and user is trying to downvote
              if(data.voteStatus === args.value) {
                return;
              }

              // increment OR decrement post points
              // do it *2 if user is changing voteStatus
              const newPoints = (data.points as number) + (!data.voteStatus ? 1 : 2 ) * value;

              // write to cache the new points and voteStatus by postId
              cache.writeFragment(
                gql`
                  fragment _ on Post {
                    points
                    voteStatus
                  }
                `,
                { id: postId, points: newPoints, voteStatus: value }
              )
            }
          },
          // run this when createPost mutation executes
          createPost: (_result, args, cache, info) => {
            // loop over ALL paginated data
            const allFields = cache.inspectFields("Query");
            const fieldInfos = allFields.filter((info) => info.fieldName === "posts");
            fieldInfos.forEach((fi) => {
              // invalidate posts query (execute it again passing variables)
              cache.invalidate("Query", "posts", fi.arguments || {})
            })
          },
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
  }
};