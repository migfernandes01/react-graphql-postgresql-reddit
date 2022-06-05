import React from 'react';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../../utils/createUrqlClient';
import { useRouter } from 'next/router';
import { usePostQuery } from '../../generated/graphql';
import { Layout } from '../../components/Layout';
import { Heading } from '@chakra-ui/react';
import { useGetPostFromUrl } from '../../utils/useGetPostFromUrl';

const Post: React.FC = ({}) => {
    // execute custom hook to get post from id in url
    const [{ data, error, fetching }] = useGetPostFromUrl();

    // if error:
    if(error) {
        return (
            <Layout>
                <div>Error...</div>
            </Layout>
        );
    }

    // if not fetching, no error, but data.post is null:
    if(!data?.post){
        return (
            <Layout>
                <div>Post not found...</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <Heading mb={4}>{data.post.title}</Heading>
            {data.post.text}
        </Layout>
    );
}

// connect component with URQL client using SSR
export default withUrqlClient(createUrqlClient, { ssr: true })(Post);