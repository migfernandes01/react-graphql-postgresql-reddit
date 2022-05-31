import { withUrqlClient } from "next-urql";
import { Layout } from "../components/Layout";
import { NavBar } from "../components/NavBar";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import {Box, Heading, Text, Link as ChakraLink, Stack, Flex, Button} from '@chakra-ui/react';
import Link from 'next/link';
import { useState } from "react";

const Index = () => {
  // state for variables to pass in query to get posts
  const [variables, setVariables] = useState({ limit: 10, cursor: null as null | string });

  // hook for posts query
  const [{ data, fetching }] = usePostsQuery({
    variables: variables
  });

  // not loading, no data
  if(!fetching && !data){
    return <div>No posts yet...</div>
  }

  return (
    <Layout>
      <Flex>
        <Heading>Reddit</Heading>
        <Link href="/create-post">
          <ChakraLink ml='auto'>Create Post</ChakraLink>
        </Link>
      </Flex>
      <br/>
      {fetching && !data ? (
        <p>Loading...</p>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map((post) => (
            <Box key={post.id} p={5} shadow='md' borderWidth='1px'>
              <Heading fontSize='xl'>{post.title}</Heading>
              <Text>Posted by {post.creator.username}</Text>
              <Text mt={4}>{post.textSnippet}...</Text>
            </Box>
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
