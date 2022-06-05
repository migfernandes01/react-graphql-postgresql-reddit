import { withUrqlClient } from "next-urql";
import { Layout } from "../components/Layout";
import { NavBar } from "../components/NavBar";
import { useDeletePostMutation, usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { Box, Heading, Text, Link as ChakraLink, Stack, Flex, Button, IconButton } from '@chakra-ui/react';
import Link from 'next/link';
import { useState } from "react";
import { PostVote } from "../components/PostVote";
import { DeleteIcon } from "@chakra-ui/icons";

const Index = () => {
  // state for variables to pass in query to get posts
  const [variables, setVariables] = useState({ limit: 10, cursor: null as null | string });

  // hook for posts query
  const [{ data, fetching }] = usePostsQuery({
    variables: variables
  });

  // hook for delete post mutation
  const [,deletePost] = useDeletePostMutation();

  // not loading, no data
  if(!fetching && !data){
    return <div>No posts yet...</div>
  }

  return (
    <Layout>
      {fetching && !data ? (
        <p>Loading...</p>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map((post) => (
            <Flex key={post.id} p={5} shadow='md' borderWidth='1px'>
              <PostVote post={post}/>
              <Box flex={1}>
                <Link href="/post/[id]" as={`/post/${post.id}`}>
                  <ChakraLink>
                    <Heading fontSize='xl'>{post.title}</Heading>
                  </ChakraLink>
                </Link>
                <Text>Posted by {post.creator.username}</Text>
                <Flex>
                  <Text flex={1} mt={4}>{post.textSnippet}...</Text>
                  <IconButton 
                    colorScheme='red' 
                    aria-label="Delete Post" 
                    icon={<DeleteIcon />}
                    onClick={() => {
                      deletePost({ id: post.id })
                    }}
                  />
                </Flex>
              </Box>
            </Flex>
          ))}
        </Stack>
      )}
      {data && data.posts.hasMore && (
        <Flex>
          <Button 
            isLoading={fetching} 
            m='auto' 
            my={8} 
            onClick={ () => setVariables({ limit: variables.limit, cursor: data.posts.posts[data.posts.posts.length - 1].createdAt })}
          >
            Load More
          </Button>
        </Flex>)
      }
    </Layout>
  );
  
};

// use URQL client in this component using server side rendering
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
