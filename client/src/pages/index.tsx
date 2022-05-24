import { withUrqlClient } from "next-urql";
import { Layout } from "../components/Layout";
import { NavBar } from "../components/NavBar";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import {Link as ChakraLink} from '@chakra-ui/react';
import Link from 'next/link';

const Index = () => {
  // hook for posts query
  const [{data}] = usePostsQuery();

  return (
    <Layout>
      <Link href="/create-post">
        <ChakraLink>Create Post</ChakraLink>
      </Link>
      <div color="white">Hello world</div>
      <br />
      {!data ? <p>Loading...</p> : data.posts.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </Layout>
  );
  
};

// use URQL client in this component using server side rendering
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
